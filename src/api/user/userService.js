import { UserModel } from './userModel.js';
import { userRepository } from './userRepository.js';

class UserService {
    async getUser(req, res) {
        const user = await userRepository.getByNickname(req.params.nickname);

        if (!user) {
            return res.code(404).send({ message: 'Can\'t find user with nickname ' + req.params.nickname })
        } else {
            return res.send(user);
        }
    }

    async createUser(req, res) {
        const user = new UserModel({
            email: req.body.email,
            nickname: req.params.nickname,
            fullname: req.body.fullname,
            about: req.body.about
        });

        const dbUser = await userRepository.getUsersByEmailOrNickname(user.props.email, user.props.nickname);
        if (dbUser && dbUser.length) {
            return res.code(409).send(dbUser);
        }

        const result = await userRepository.create(user);
        return res.code(result.props.status).send(result.props.body);
    }

    async updateUser(req, res) {
        const user = await userRepository.getByNickname(req.params.nickname);
        const updateUser = new UserModel({
            nickname: req.params.nickname,
            email: req.body.email,
            about: req.body.about,
            fullname: req.body.fullname,
        });

        if (!user) {
            return res.code(404).send({ message: 'Can\'t find user with nickname ' + req.params.nickname })
        }

        const update = await userRepository.update(updateUser);

        if (!update) {
            return res.code(409).send({ message: 'Can\'t change user with nickname ' + req.params.nickname })
        }

        const body = update === true ? user : update;

        return res.send(body);
    }

}

export const userService = new UserService();
