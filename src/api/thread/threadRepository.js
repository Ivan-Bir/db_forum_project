import { ResponseModel } from "../commonModels/responseModel.js";
import { dbService } from "../../db/dbService.js";
import { validate } from "../utils/utils.js";
// import { ForumModel } from "./forumModel.js";
// import { UserModel } from "../user/userModel.js";

class ThreadRepository {
    constructor() {
        this.dbCon = dbService;
    }

    async createThread(thread, forum, user) {
        const response = new ResponseModel();

        try {
            response.props.body  = await this.dbCon.db.one('INSERT INTO thread (slug, user_nickname, forum_slug, created, title, message) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, slug, user_nickname, forum_slug, created, title, message, votes',
                [
                    thread.props.slug,
                    user.props.nickname,
                    // user.props.id,
                    forum.props.slug,
                    thread.props.created,
                    thread.props.title,
                    thread.props.message,
                ]);
            response.props.status = 201;
        } catch (error) {
            response.props.status = 505;
            response.props.body = { message: error.message };
        }

        return response;
    }

    async getThread(typeKey, identificator) {
        try {
            return await this.dbCon.db.oneOrNone(`SELECT id, slug, user_nickname, forum_slug, created, title, message, votes FROM thread WHERE ${typeKey} = $1`, identificator)
        } catch(error) {
            console.log(`ERROR: getThread thread, ${JSON.stringify(error)}`);
        }
    }

    async getForumThread(options, forum_slug) {
        const { since, desc, limit } = options;
        let dbRequest = 'SELECT id, slug, title, user_nickname, forum_slug, message, votes, created FROM thread WHERE LOWER(forum_slug) = LOWER($1) ';

        if (since) {
            if (desc) {
                dbRequest += 'AND created <= $2 ';
            } else {
                dbRequest += 'AND created >= $2 ';
            }
        }

        if (desc) {
            dbRequest += 'ORDER BY created DESC ';
        } else {
            dbRequest += 'ORDER BY created ASC ';
        }

        if (limit > -1) {
            dbRequest += 'LIMIT $3 ';
        }

        try {
            return await this.dbCon.db.manyOrNone(dbRequest, [forum_slug, since, limit]);
        } catch (error) {
            console.log(`ERROR: getBySlug forum, ${JSON.stringify(error)}`);
        }
    }

    async createVote(voice, userNickname, typeKey, threadIdentif) {
        const response = new ResponseModel();
        console.log('voice, userNickname, typeKey, threadIdentif', voice, userNickname, typeKey, threadIdentif);
        const request = typeKey === 'id' ? 'VALUES ($1, $2, $3)' : 'SELECT $1, thread.id, $3 FROM thread WHERE thread.slug = $2';

        console.log(request);
        try {
            // const data = await this.dbCon.db.tx((t) => {
            //    return t.batch([
            //        t.none(`INSERT INTO vote (user_nickname, thread_id, voice) ${request} ON CONFLICT ON CONSTRAINT votes_user_thread_unique DO UPDATE SET voice = $3`, [userNickname, threadIdentif, voice]),
            //        t.one(`SELECT id, slug, user_nickname, forum_slug, created, title, message, votes FROM thread WHERE ${typeKey} = $1`, threadIdentif),
            //    ]);
            // });

            const result = await this.dbCon.db.tx((t) => {
                return t.batch([
                    t.none(`INSERT INTO vote (user_nickname, thread_id, voice) ${request} ON CONFLICT (thread_id, user_nickname) DO UPDATE SET voice = $3`, [userNickname, threadIdentif, voice]),
                    t.one(`SELECT id, slug, user_nickname, forum_slug, created, title, message, votes FROM thread WHERE ${typeKey} = $1`, threadIdentif),
                ]);
             });

            response.props.body = result[1];
            response.props.status = 200;
        } catch (error) {
            response.props.status = 500;
            response.props.body = error.message;
        }

        return response;
    }

    async updateThread(thread_id, thread) {
        try {
            const column_set = new this.dbCon.pgp.helpers.ColumnSet([
                validate('message'), validate('title')
            ], { table: 'thread' });

            let query = this.dbCon.pgp.helpers.update(thread.props, column_set, null, { emptyUpdate: true });

            if (query === true) {
                return true;
            } else {
                query += `WHERE id = ${thread_id} RETURNING *`;
            }
            return await this.dbCon.db.oneOrNone(query);
        } catch (error) {
            console.log(`ERROR: updateThread thread, ${JSON.stringify(error)}`);
        }
    }

    async getCount() {
        try {
            const items = await this.dbCon.db.one(`SELECT count(id) FROM thread`);
            return items ? Number(items.count) : 1;
        } catch (error) {
            console.log(`ERROR: getCount thread, ${JSON.stringify(error)}`);
        }
    }

    async clearAll() {
        try {
            return await this.dbCon.db.none(`TRUNCATE thread CASCADE`);
        } catch (error) {
            console.log(`ERROR: clearAll thread, ${JSON.stringify(error)}`);
        }
    }
}

export const threadRepository = new ThreadRepository();
