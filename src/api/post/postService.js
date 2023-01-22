import { PostModel } from '../post/postModel.js';
import { postRepository } from '../post/postRepository.js';
import { userRepository } from '../user/userRepository.js';
import { threadRepository } from '../thread/threadRepository.js';
import { forumRepository } from '../forum/forumRepository.js';

class PostService {
    async getDetails(req, res) {
        const dbPost = await postRepository.getPostById(req.params.id);

        if (!dbPost) {
            return res.code(404).send({
                message: `Can't find post with id ${req.params.id}`
            });
        }

        let result = {};

        result.post = {
            forum: dbPost.forum_slug,
            id: dbPost.id,
            thread: dbPost.thread_id,
            message: dbPost.message,
            parent: dbPost.parent_id,
            isEdited: dbPost.is_edited,
            author: dbPost.user_nickname,
            created: dbPost.created
        };

        if (req.query.related) {
            const options = req.query.related.split(',');

            if (options.includes('user')) {
                const dbUser = await userRepository.getByNickname(dbPost.user_nickname);
                result.author = {
                    id: dbUser.id,
                    nickname: dbUser.nickname,
                    about: dbUser.about,
                    fullname: dbUser.fullname,
                    email: dbUser.email
                };
            }

            if (options.includes('thread')) {
                const dbThread = await threadRepository.getThread('id', dbPost.thread_id);
                result.thread = {
                    id: dbThread.id,
                    title: dbThread.title,
                    author: dbThread.user_nickname,
                    forum: dbThread.forum_slug,
                    message: dbThread.message,
                    votes: dbThread.votes,
                    created: dbThread.created,
                    slug: dbThread.slug
                }
            }

            if (options.includes('forum')) {
                const dbForum = await forumRepository.getBySlug(dbPost.forum_slug);
                result.forum = {
                    title: dbForum.title,
                    user: dbForum.user_nickname,
                    slug: dbForum.slug,
                    posts: dbForum.posts,
                    threads: dbForum.threads
                }
            }
        }

        return res.code(200).send(result);
    }

    async updatePost(req, res) {
        const id = +req.params.id;
        const dbPost = await postRepository.getPostById(id);
        const message = req.body.message;

        if (!dbPost) {
            return res.code(404).send({
                message: `Can't find post with id ${id}`
            });
        }

        if (!message || message === dbPost.message) {
            return res.code(200).send({
                forum: dbPost.forum_slug,
                id: dbPost.id,
                thread: dbPost.thread_id,
                message: dbPost.message,
                parent: dbPost.parent_id,
                isEdited: dbPost.is_edited,
                author: dbPost.user_nickname,
                created: dbPost.created
            });
        }

        const updatedPost = await postRepository.updatePost(new PostModel({
            ...dbPost,
            message: req.body.message
        }));

        return res.code(updatedPost.props.status).send(updatedPost.props.body);
    }
}

export const postService = new PostService();
