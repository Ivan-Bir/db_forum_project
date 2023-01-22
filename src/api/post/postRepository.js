import { ResponseModel } from '../commonModels/responseModel.js';
import { dbService } from '../../db/dbService.js';

class PostRepository {
    constructor() {
        this.dbCon = dbService;
    }

    async createPost(posts, thread) {
        const response = new ResponseModel();

        for (let i = 0; i < posts.length; i++) {
            if (posts[i].parent) {
                const dbPostParent = await this.dbCon.db.oneOrNone('SELECT id FROM post WHERE id = $1 AND thread_id = $2', [posts[i].parent, thread.props.id]);
                if (!dbPostParent) {
                    response.props.status = 409;
                    return response;
                }
            }
        }

        let users;

        try {
            users = await this.dbCon.db.tx((t) => {
                const queries_users = posts.map((post) => {
                    return t.one('SELECT id, nickname FROM users WHERE nickname = $1', [post.author]);
                });

                return t.batch(queries_users);
            });
        } catch (error) {
            response.props.body = error.message;
            response.props.status = 404;
            return response;
        }

        const time = new Date();
        const values = posts.map((post, idx) => {
            return {
                user_nickname: users[idx].nickname,
                forum_slug: thread.props.forum_slug,
                thread_id: thread.props.id,
                created: time,
                message: post.message,
                parent_id: post.parent || 0,
            }
        });

        const cs = new this.dbCon.pgp.helpers.ColumnSet(
            ['user_nickname', 'forum_slug', 'thread_id', 'created', 'message', 'parent_id']
            ,{ table: 'post'});
        const query = this.dbCon.pgp.helpers.insert(values, cs) + ' RETURNING id';


        try {
            const postIds = await this.dbCon.db.many(query);

            response.props.body = values.map((post, index) => {
                return {
                    id: postIds[index].id,
                    user_nickname: post.user_nickname,
                    is_edited: false,
                    created: post.created,
                    message: post.message,
                    parent_id: post.parent_id,
                    forum_slug: post.forum_slug,
                    thread_id: post.thread_id,
                }
            });

            response.props.status = 201;
        } catch (error) {
            response.props.status = 409;
            response.props.body = error.message;
        }

        return response;
    }

    async updatePost(post) {
        const response = new ResponseModel();
        try {
            const dbPost = await this.dbCon.db.one('UPDATE post SET (message, is_edited) = (coalesce($1, message), coalesce(message <> $1, is_edited)) WHERE id = $2 RETURNING id, user_nickname, created, message, parent_id, is_edited, forum_slug, thread_id', [post.props.message, post.props.id]);
            response.props.body = {
                id: dbPost.id,
                parent: dbPost.parent_id,
                author: dbPost.user_nickname,
                message: dbPost.message,
                isEdited: dbPost.is_edited,
                forum: dbPost.forum_slug,
                thread: dbPost.thread_id,
                created: dbPost.created
            };

            response.props.status = 200;
        } catch (error) {
            response.props.status = 500;
            response.props.body = { message: error.message };
        }

        return response;
    }

    async getPostById(id) {
        try {
            return await this.dbCon.db.oneOrNone('SELECT id, user_nickname, created, message, parent_id, forum_slug, is_edited, thread_id FROM post WHERE id = $1', id);
        } catch (error) {
            console.error(`ERROR: getPostById post, ${JSON.stringify(error)}`);
        }
    }

    async getPostByThreadId(sort, id, params) {
        let { limit, since, desc } = params;

        let query = 'SELECT post.id, post.created, post.thread_id, post.forum_slug, ' +
            'post.user_nickname, post.message, post.parent_id, post.pathTree FROM post ';
        const sign = desc ? '<' : '>';

        const order = desc ? 'desc' : 'asc';

        switch (sort) {
            case 'tree':
                if (since) {
                    query += `WHERE post.pathTree ${sign} (SELECT post.pathTree FROM post WHERE post.id = $3)
                        AND post.thread_id = $1 ORDER BY post.pathTree ${order}, post.created, post.id LIMIT $2`;
                } else {
                    query += `WHERE post.thread_id = $1 ORDER BY post.pathTree ${order}, post.created, post.id LIMIT $2;`
                }
                break;
            case 'parent_tree':
                if (since) {
                    if (order === 'asc') {
                        query += `JOIN (SELECT post.pathTree[1] AS root FROM post WHERE post.thread_id = $1 and post.pathTree[1] >
                    (SELECT post.pathTree[1] FROM post WHERE post.id = $3) AND array_length(post.pathTree, 1) = 1 ORDER BY root limit $2)
                    root_post ON post.pathTree[1] = root_post.root ORDER BY post.pathTree, post.created, post.id`;
                    } else {
                        query += `JOIN (SELECT post.pathTree[1] AS root FROM post WHERE post.thread_id = $1 and post.pathTree[1] <
                    (SELECT post.pathTree[1] FROM post WHERE post.id = $3) AND array_length(post.pathTree, 1) = 1 ORDER BY root desc LIMIT $2)
                    root_post on post.pathTree[1] = root_post.root ORDER BY post.pathTree[1] desc, post.pathTree[2:], post.created, post.id`;
                    }
                } else {
                    query += `WHERE post.pathTree[1] IN
                    (SELECT DISTINCT post.pathTree[1] FROM post WHERE post.thread_id = $1 AND
                    array_length(post.pathTree, 1) = 1 ORDER BY post.pathTree[1] ${order} LIMIT $2)
                    ORDER BY post.pathTree[1] ${order}, post.pathTree, post.created, post.id`;
                }
                break;
            default:
                if (since) {
                    query += `WHERE post.thread_id = $1 AND post.id ${sign} $3 ORDER BY post.created ${order}, post.id ${order} LIMIT $2`;
                } else {
                    query += `WHERE post.thread_id = $1 ORDER BY post.created ${order}, post.id ${order} LIMIT $2`;
                }
                break;
        }
        return await this.dbCon.db.manyOrNone(query, [id, limit, since]);
    }

    async getCount() {
        try {
            const items = await this.dbCon.db.one(`SELECT count(id) FROM post`);
            return items ? +items.count : 1;
        } catch (error) {
            console.error(`ERROR: getCount post, ${JSON.stringify(error)}`);
        }
    }

    async clear() {
        try {
            return await this.dbCon.db.none(`TRUNCATE post CASCADE`);
        } catch (error) {
            console.error(`ERROR: clear post, ${JSON.stringify(error)}`);
        }
    }
}

export const postRepository = new PostRepository();
