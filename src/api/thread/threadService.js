import { ThreadModel } from '../thread/threadModel.js';
import { threadRepository } from '../thread/threadRepository.js';
import { postRepository } from '../post/postRepository.js';
import { isId } from '../utils/utils.js';

class ThreadService {
    async createPost(req, res) {
        const posts  = req.body;

        const type = isId(req.params.slug) ? 'id' : 'slug';
        const value = isId(req.params.slug) ? +req.params.slug : req.params.slug;

        let dbThread = await threadRepository.getThread(type, value);

        if (!dbThread) {
            return res.code(404).send({
                message: `Can't find forum with slug or id ${req.params.slug}`
            });
        }

        const thread = new ThreadModel(dbThread);

        if (Array.isArray(posts) && posts.length === 0) {
            return res.code(201).send(posts);
        }

        const resultPost = await postRepository.createPost(posts, thread);

        if (resultPost.props.status === 409) {
            return res.code(409).send({ message: resultPost.props.body });
        } else if (resultPost.props.status === 404) {
            return res.code(404).send({ message: "Can't find post author by nickname" })
        }

        return res.code(201).send(resultPost.props.body.map((post) => ({
            id: post.id,
            parent: post.parent_id,
            author: post.user_nickname,
            message: post.message,
            isEdited: post.is_edited,
            forum: post.forum_slug,
            thread: post.thread_id,
            created: post.created
        })))
    }

    async voteToThread(req, res) {
        // TO MODEL
        const vote = req.body;

        const typeKey = isId(req.params.slug) ? 'id' : 'slug';
        const threadIdenf = typeKey === 'id' ? +req.params.slug : req.params.slug;

        const dbVote = await threadRepository.createVote(vote.voice, vote.nickname, typeKey, threadIdenf);

        if (dbVote.props.status !== 200) {
            return res.code(404).send({ message: dbVote.props.body })
        }

        return res.code(200).send({
            id: dbVote.props.body.id,
            author: dbVote.props.body.user_nickname,
            created: dbVote.props.body.created,
            forum: dbVote.props.body.forum_slug,
            message: dbVote.props.body.message,
            slug: dbVote.props.body.slug,
            title: dbVote.props.body.title,
            votes: dbVote.props.body.votes
        });
    }

    async getDetails(req, res) {
        const typeKey = isId(req.params.slug) ? 'id' : 'slug';
        const threadIdenf = typeKey === 'id' ? +req.params.slug : req.params.slug;

        let dbThread = await threadRepository.getThread(typeKey, threadIdenf);

        if (!dbThread) {
            return res.code(404).send({ message: `Can't find forum with slug or id ${req.params.slug}`});
        } else {
            return res.code(200).send({
                author: dbThread.user_nickname,
                created: dbThread.created,
                forum: dbThread.forum_slug,
                id: dbThread.id,
                message: dbThread.message,
                slug: dbThread.slug,
                title: dbThread.title,
                votes: dbThread.votes,
            });
        }
    }

    async getThreadsPost(req, res) {
        const typeKey = isId(req.params.slug) ? 'id' : 'slug';
        const threadIdenf = typeKey === 'id' ? +req.params.slug : req.params.slug;

        let dbThread = await threadRepository.getThread(typeKey, threadIdenf);

        if (!dbThread) {
            return res.code(404).send({
                message: `Can't find forum with slug or id ${req.params.slug}`
            });
        }

        const posts = await postRepository.getPostByThreadId(req.query.sort, dbThread.id, {
            desc : req.query.desc === 'true',
            limit : req.query.limit ? parseInt(req.query.limit) : 100,
            since : req.query.since,
        });

        return res.code(200).send(posts.map((post) => ({
            author: post.user_nickname,
            created: post.created,
            forum: post.forum_slug,
            id: post.id,
            message: post.message,
            thread: post.thread_id,
            parent: post.parent_id
        })));
    }

    async updateThread(req, res) {
        const typeKey = isId(req.params.slug) ? 'id' : 'slug';
        const threadIdenf = typeKey === 'id' ? +req.params.slug : req.params.slug;

        let dbThread = await threadRepository.getThread(typeKey, threadIdenf);

        if (!dbThread) {
            return res.code(404).send({
                message: `Can't find forum with slug or id ${req.params.slug}`
            });
        }

        const updatedThread = await threadRepository.updateThread(dbThread.id, new ThreadModel({
            ...dbThread,
            title: req.body.title,
            message: req.body.message
        }));

        const result = updatedThread === true ? dbThread : updatedThread;

        return res.code(200).send({
            id: result.id,
            title: result.title,
            author: result.user_nickname,
            forum: result.forum_slug,
            message: result.message,
            votes: result.votes,
            slug: result.slug,
            created: result.created
        });
    }
}

export const threadService = new ThreadService();
