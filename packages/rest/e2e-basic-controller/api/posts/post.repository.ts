import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { Posts } from '../../db';

@Assemblage()
export class PostRepository implements AbstractAssemblage {
  public findAll() {
    return Posts;
  }

  public findBySender(id: number) {
    return Posts.filter((post: any) => post.sender === id);
  }

  public findByReceiver(id: number) {
    return Posts.filter((post: any) => post.receiver === id);
  }

  public create(post: { sender: number; receiver: number; content: string }) {
    const lastId = Math.max(...Posts.map((post: any) => post.id));
    const nextId = lastId + 1;
    const newPost = {
      id: nextId,
      ...post,
    };
    Posts.push(newPost);
    return newPost;
  }

  public delete(id: number) {
    const existing = Posts.find((post: any) => post.id === id);
    if (existing) {
      const index = Posts.indexOf(existing);
      Posts.splice(index, 1);
      return existing;
    }
  }
}
