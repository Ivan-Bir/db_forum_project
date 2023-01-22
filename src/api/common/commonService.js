import { postRepository } from '../post/postRepository.js';
import { userRepository } from '../user/userRepository.js';
import { threadRepository } from '../thread/threadRepository.js';
import { forumRepository } from '../forum/forumRepository.js';

class CommonService {
    async status(req, res) {
        const forum = await forumRepository.getCount();
        const user = await userRepository.getCount();
        const thread = await threadRepository.getCount();
        const post = await postRepository.getCount();

        return res.code(200).send({ forum, user, thread, post });
    }

    async delete(req, res) {
        await forumRepository.clear();
        await userRepository.clear();
        await threadRepository.clear();
        await postRepository.clear();

        return res.code(200).send(null);
    }
}

export const commonService = new CommonService();
