import { UserModel } from '../user/userModel.js';
import { ThreadModel } from '../thread/threadModel.js';
import { threadRepository } from '../thread/threadRepository.js';
import { userRepository } from '../user/userRepository.js';
import { ForumModel } from './forumModel.js';
import { forumRepository } from './forumRepository.js';
import { isId } from '../utils/utils.js';

class ForumService {
    async createForum(req, res) {
        const forum = new ForumModel({
            title: req.body.title,
            user_nickname: req.body.user,
            slug: req.body.slug,
        });

        const dbUser = await userRepository.getByNickname(forum.props.user_nickname)

        if (!dbUser) {
            return res.code(404).send({
                message: `Can't find user with nickname ${forum.props.user_nickname}`
            });
        }

        const user = new UserModel(dbUser);

        const dbForum = await forumRepository.getBySlug(forum.props.slug);

        if (dbForum) {
            return res.code(409).send({
                slug: dbForum.slug,
                title: dbForum.title,
                user: dbForum.user_nickname,
            });
        }

        const result = await forumRepository.createForum(forum, user);
        return res.code(result.props.status).send(result.props.body);
    }

    async getForumDetails(req, res) {
        const slug = req.params.slug;

        const dbForum = await forumRepository.getBySlug(slug);

        if (!dbForum) {
            return res.code(404).send({
                message: `Can't find forum with slug ${slug}`
            })
        } else {
            return res.code(200).send({
                slug: dbForum.slug,
                title: dbForum.title,
                user: dbForum.user_nickname,
                posts: dbForum.posts,
                threads: dbForum.threads
            });
        }
    }

    async createThread(req, res) {
        const thread = new ThreadModel({
            slug: req.body.slug,
            forum_slug: req.params.slug,
            user_nickname: req.body.author,
            created: req.body.created,
            message: req.body.message,
            title: req.body.title
        });

        const slug = req.params.slug;
        if (isId(slug)) {
            return res.code(400).send({
                message: 'Slug can not contain only digit'
            });
        }

        const author = req.body.author;
        const dbUser = await userRepository.getByNickname(author);

        if (!dbUser) {
            return res.code(404).send({
                message: `Can't find user with nickname ${author}`
            });
        }

        const user = new UserModel(dbUser);

        ////optimise by PromiseAll
        let dbThread = await threadRepository.getThread('slug', thread.props.slug);
        let dbForum = await forumRepository.getBySlug(slug);

        if (dbThread) {
            return res.code(409).send({
                id: dbThread.id,
                title: dbThread.title,
                author: dbThread.user_nickname,
                forum: dbThread.forum_slug,
                message: dbThread.message,
                votes: dbThread.votes,
                slug: dbThread.slug,
                created: dbThread.created
            });
        }

        if (!dbForum) {
            return res.code(404).send({
                message: `Can't find forum with slug ${slug}`
            });
        }

        const forum = new ForumModel(dbForum);
        const threadData = await threadRepository.createThread(thread, forum, user);

        if (threadData.props.status === 201) {
            if (!req.body.slug) {
                return res.code(201).send({
                    id: threadData.props.body.id,
                    author: threadData.props.body.user_nickname,
                    forum: threadData.props.body.forum_slug,
                    message: threadData.props.body.message,
                    title: threadData.props.body.title,
                    created: threadData.props.body.created
                });
            }

            return res.code(201).send({
                id: threadData.props.body.id,
                slug: threadData.props.body.slug,
                author: threadData.props.body.user_nickname,
                forum: threadData.props.body.forum_slug,
                message: threadData.props.body.message,
                title: threadData.props.body.title,
                created: threadData.props.body.created
            });
        } else {
            return res.code(500).send(threadData.props.body);
        }
    }

    async getForumThreads(req, res) {
        const slug = req.params.slug;
        const options = {
            desc : req.query.desc === 'true',
            limit : req.query.limit ? +req.query.limit : 100,
            since : req.query.since
        };

        const dbForum = await forumRepository.getBySlug(slug);

        if (!dbForum) {
            return res.code(404).send({ message: `Can't find forum with slug ${slug}` })
        }

        const dbThreads = await threadRepository.getForumThread(options, dbForum.slug);
        return res.code(200).send(dbThreads.map((thread) => ({
            id: thread.id,
            title: thread.title,
            author: thread.user_nickname,
            forum: thread.forum_slug,
            message: thread.message,
            votes: thread.votes,
            slug: thread.slug,
            created: thread.created
        })));
    }

    async getForumUsers(req, res) {
        const slug = req.params.slug;
        const params = {
            desc : req.query.desc === 'true',
            limit : req.query.limit ? +req.query.limit : 100,
            since : req.query.since,
        };

        const dbForum = await forumRepository.getBySlug(slug);

        if (!dbForum) {
            return res.code(404).send({ message: `Can't find forum with slug ${slug}` })
        }

        const dbUsers = await userRepository.getUsersFromForum(dbForum.slug, params);
        return res
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(dbUsers);
    }
}

export const forumService = new ForumService();
