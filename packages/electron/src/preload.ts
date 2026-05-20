import { electronAPI } from '@electron-toolkit/preload';
import { contextBridge, ipcRenderer } from 'electron';
import { WindowIpcChannel } from './universal/channels';
import type {
	DefaultIpcContractMap,
	IpcContractMap,
	KnownIpcChannel,
	TypedIpcBridge,
} from './universal/types';

type RendererListener = (...args: any[]) => void;
type ElectronListener = (_event: unknown, ...args: any[]) => void;

const defaultChannels = Object.values(WindowIpcChannel) as ReadonlyArray<KnownIpcChannel>;

function getListenerEntries(
	registry: WeakMap<RendererListener, Map<string, Set<ElectronListener>>>,
	listener: RendererListener,
	channel: string
): Set<ElectronListener> {
	let channels = registry.get(listener);
	if (!channels) {
		channels = new Map<string, Set<ElectronListener>>();
		registry.set(listener, channels);
	}

	let entries = channels.get(channel);
	if (!entries) {
		entries = new Set<ElectronListener>();
		channels.set(channel, entries);
	}

	return entries;
}

export function createIpcBridge<
	Contracts extends IpcContractMap = DefaultIpcContractMap
>(
	channels: ReadonlyArray<KnownIpcChannel<Contracts>> =
		defaultChannels as ReadonlyArray<KnownIpcChannel<Contracts>>
): Readonly<TypedIpcBridge<Contracts>> {
	const listenerRegistry = new WeakMap<
		RendererListener,
		Map<string, Set<ElectronListener>>
	>();

	return {
		versions: process.versions,
		channels: [...channels],
		ipc: {
			on(channel: string, listener: RendererListener): void {
				const wrappedListener: ElectronListener = (_event, ...args) => {
					listener(...args);
				};

				getListenerEntries(listenerRegistry, listener, channel).add(
					wrappedListener
				);
				ipcRenderer.on(channel, wrappedListener);
			},
			once(channel: string, listener: RendererListener): void {
				const entries = getListenerEntries(listenerRegistry, listener, channel);
				const wrappedListener: ElectronListener = (_event, ...args) => {
					entries.delete(wrappedListener);
					listener(...args);
				};

				entries.add(wrappedListener);
				ipcRenderer.once(channel, wrappedListener);
			},
			off(channel: string, listener: RendererListener): void {
				const channelsByListener = listenerRegistry.get(listener);
				const wrappedListeners = channelsByListener?.get(channel);
				if (!wrappedListeners) {
					return;
				}

				for (const wrappedListener of wrappedListeners) {
					ipcRenderer.off(channel, wrappedListener);
				}

				wrappedListeners.clear();
				channelsByListener?.delete(channel);
			},
			removeAllListeners(channel: string): void {
				ipcRenderer.removeAllListeners(channel);
			},
			send(channel: string, ...args: any[]): void {
				ipcRenderer.send(channel, ...args);
			},
			async invoke(channel: string, ...args: any[]): Promise<any> {
				return await ipcRenderer.invoke(channel, ...args);
			},
			async emit(channel: string, ...args: any[]): Promise<void> {
				ipcRenderer.emit(channel, ...args);
			},
		},
	};
}

let exposedBridge: Readonly<TypedIpcBridge<any>> | undefined;

export function exposeIpcBridge<
	Contracts extends IpcContractMap = DefaultIpcContractMap
>(
	channels: ReadonlyArray<KnownIpcChannel<Contracts>> =
		defaultChannels as ReadonlyArray<KnownIpcChannel<Contracts>>
): Readonly<TypedIpcBridge<Contracts>> {
	if (exposedBridge) {
		return exposedBridge as Readonly<TypedIpcBridge<Contracts>>;
	}

	const bridge = createIpcBridge(channels);

	if (process.contextIsolated) {
		contextBridge.exposeInMainWorld('electron', electronAPI);
		contextBridge.exposeInMainWorld('ipc', bridge);
	} else if (typeof window !== 'undefined') {
		(window as any).electron = electronAPI;
		(window as any).ipc = bridge;
	}

	exposedBridge = bridge;

	return bridge;
}

exposeIpcBridge();

export * from './universal/channels';
