import { ResponseModel } from '../commonModels/responseModel.js';
import { dbService } from '../../db/dbService.js';

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
            console.error(`ERROR: getById forum, ${JSON.stringify(error)}`);
        }
    }

    async getBySlug(slug) {
        try {
            return await this.dbCon.db.oneOrNone(`SELECT id, slug, title, user_nickname, posts, threads FROM forum WHERE slug = $1`, slug);
        } catch (error) {
            console.error(`ERROR: getBySlug forum, ${JSON.stringify(error)}`);
        }
    }

    async getCount() {
        try {
            const items = await this.dbCon.db.one(`SELECT count(id) FROM forum`);
            return items ? +items.count : 1;
        } catch (error) {
            console.error(`ERROR: getCount forum, ${JSON.stringify(error)}`);
        }
    }

    async clear() {
        try {
            return await this.dbCon.db.none(`TRUNCATE forum CASCADE`);
        } catch (error) {
            console.error(`ERROR: clear forum, ${JSON.stringify(error)}`);
        }
    }
}

export const forumRepository = new ForumRepository();
