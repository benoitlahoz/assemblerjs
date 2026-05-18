import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { Posts } from '../../db';

@Assemblage()
export class PostRepository implements AbstractAssemblage {
  public findAll() {
    return Posts;
  }

  public findBySender(id: number) {
    return Posts.filter((post) => post.sender === id);
  }

  public findByReceiver(id: number) {
    return Posts.filter((post) => post.receiver === id);
  }

  public create(post: { sender: number; receiver: number; content: string }) {
    const lastId = Math.max(...Posts.map((p) => p.id));
    const newPost = { id: lastId + 1, ...post };
    Posts.push(newPost);
    return newPost;
  }

  public delete(id: number) {
    const existing = Posts.find((post) => post.id === id);
    if (!existing) return undefined;
    const index = Posts.indexOf(existing);
    Posts.splice(index, 1);
    return existing;
  }
}
