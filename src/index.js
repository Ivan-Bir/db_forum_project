import fastify from 'fastify';

import { API } from './api/config/routes.js';
import { userService } from './api/user/userService.js';
import { forumService } from './api/forum/forumService.js';
import { threadService } from './api/thread/threadService.js';
import { postService } from './api/post/postService.js';
import { commonService } from './api/common/commonService.js';


const app = fastify({});

app.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
    try {
        let json = {};
        if (body) {
            json = JSON.parse(body);
        }

        done(null, json);
    } catch (error) {
        console.error(error);
        error.statusCode = 403;
        done(error, null);
    }
});


app.get('/api', (request, response) => {
    return response.code(404).send(null);
});

// user
app.get(API.get.user.profile, userService.getUser);
app.post(API.post.user.create, userService.createUser);
app.post(API.get.user.profile, userService.updateUser);

// forum
app.get(API.get.forum.details, forumService.getForumDetails);
app.get(API.get.forum.users, forumService.getForumUsers);
app.get(API.get.forum.threads, forumService.getForumThreads);
app.post(API.post.forum.create, forumService.createForum);
app.post(API.post.forum.createThread, forumService.createThread);

// thread
app.get(API.get.thread.details, threadService.getDetails);
app.get(API.get.thread.posts, threadService.getThreadsPost);
app.post(API.post.thread.create, threadService.createPost);
app.post(API.post.thread.update, threadService.updateThread);
app.post(API.post.thread.vote, threadService.voteToThread);

// post
app.get(API.get.post.threads, postService.getDetails);
app.post(API.post.post.update, postService.updatePost);

// common
app.get(API.get.service, commonService.status);
app.post(API.post.service, commonService.delete);

app.listen({ port: 5000, host: '0.0.0.0' }, () => {
    console.log(`Start listening at port: 5000`);
});
