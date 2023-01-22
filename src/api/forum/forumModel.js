import { BaseModel } from '../commonModels/baseModel.js';

export class ForumModel extends BaseModel {
    constructor(props) {
        super(props);

        const defaultForum = {
            title: null,
            user_nickname: null,
            slug: null,
            posts: null,
            threads: null
        };

        this.props = Object.assign(defaultForum, props);
    }
};
