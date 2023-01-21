import { ResponseModel } from "../commonModels/responseModel.js";
import { dbService } from "../../db/dbService.js";
import { validate } from "../utils/utils.js";
import { ForumModel } from "./forumModel.js";
import { UserModel } from "../user/userModel.js";


class ForumRepository {
    constructor() {
        this.dbCon = dbService;
    }

    async createForum(forum, user) {
        const response = new ResponseModel();
        const { slug, title } = forum.props;
        const { nickname } = user.props;

        try {
            const data = await this.dbCon.db.one('INSERT INTO forum (slug, title, user_nickname) VALUES ($1, $2, $3) RETURNING id, slug, title, user_nickname, posts, threads', [slug, title, nickname]);
            response.props.body = {
                slug: data.slug,
                title: data.title,
                user: data.user_nickname
            };
            response.props.status = 201;
        } catch (error) {
            response.props.status = 500;
            response.props.body = { message: error.message };
        }

        return response
    }

    async getById(id) {
        try {
            return await this.dbCon.db.oneOrNone(`SELECT id, slug, title, user_nickname, posts, threads FROM forum WHERE id = $1`, id);
        } catch (error) {
            console.log(`ERROR: getById forum, ${JSON.stringify(error)}`);
        }
    }

    async getBySlug(slug) {
        try {
            return await this.dbCon.db.oneOrNone(`SELECT id, slug, title, user_nickname, posts, threads FROM forum WHERE slug = $1`, slug);
        } catch (error) {
            console.log(`ERROR: getBySlug forum, ${JSON.stringify(error)}`);
        }
    }

    // async addPostsCount(slug, count) {
    //     const response = new ResponseModel();

    //     try {
    //         await this.dbCon.db.none('UPDATE forums SET posts = posts + $1 WHERE slug = $2', [count, slug]);
    //         response.props.status = 200;
    //     } catch (e) {
    //         response.props.status = 500;
    //     }

    //     return response;
    // }

    // async addThreadCount(id, count) {
    //     const response = new ResponseModel();
    //     count = !count ? 1 : count;

    //     try {
    //         await this.dbCon.db.none('UPDATE forums SET threads = threads + $1 WHERE id = $2', [count, id]);
    //         response.props.status = 200;
    //     } catch (e) {
    //         response.props.status = 500;
    //         response.props.body = { message: e.message };
    //     }

    //     return response;
    // }

    async getCount() { /////&&&&
        try {
            const items = await this.dbCon.db.one(`SELECT count(id) FROM forum`);
            return items ? Number(items.count) : 1;
        } catch (error) {
            console.log(`ERROR: getCount forum, ${JSON.stringify(error)}`);
        }
    }

    async clearAll() {
        try {
            return await this.dbCon.db.none(`TRUNCATE forum CASCADE`);
        } catch (error) {
            console.log(`ERROR: clearAll forum, ${JSON.stringify(error)}`);
        }
    }
}

export const forumRepository = new ForumRepository();
