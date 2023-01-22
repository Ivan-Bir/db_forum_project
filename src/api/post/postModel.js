import { BaseModel } from '../commonModels/baseModel.js';

export  class PostModel extends BaseModel {
    constructor(props) {
        super(props);

        const defaultPost = {
            id: null,
            parent_id: null,
            user_nickname: null,
            message: null,
            is_edited: null,
            forum_slug: null,
            thread_id: null,
            created: null,
            pathTree: null,
        };

        this.props = Object.assign(defaultPost, props);
    }
};
