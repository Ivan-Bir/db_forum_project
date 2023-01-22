CREATE EXTENSION IF NOT EXISTS CITEXT;

CREATE UNLOGGED TABLE IF NOT EXISTS users (
    id       serial         UNIQUE NOT NULL,
    nickname citext         NOT NULL PRIMARY KEY,
    email    citext         NOT NULL UNIQUE,
    fullname citext         NOT NULL,
    about    text           NOT NULL
);

CREATE UNLOGGED TABLE IF NOT EXISTS forum (
    id            serial             NOT NULL,
    title         varchar(255)       NOT NULL,
    user_nickname citext             NOT NULL REFERENCES users (nickname) ON DELETE CASCADE,
    slug          citext             NOT NULL UNIQUE PRIMARY KEY,
    posts         int                NOT NULL DEFAULT 0,
    threads       int                NOT NULL DEFAULT 0
);

CREATE UNLOGGED TABLE IF NOT EXISTS forum_users (
    user_nickname    citext             NOT NULL REFERENCES users (nickname) ON DELETE CASCADE,
    forum_slug       citext             NOT NULL REFERENCES forum (slug) ON DELETE CASCADE,
    PRIMARY KEY      (user_nickname, forum_slug)
);

CREATE UNLOGGED TABLE IF NOT EXISTS thread (
    id            serial         NOT NULL PRIMARY KEY,
    -- slug          citext         NOT NULL,
    slug          citext         UNIQUE,
    user_nickname citext         NOT NULL REFERENCES users (nickname) ON DELETE CASCADE,
    forum_slug    citext         NOT NULL REFERENCES forum (slug) ON DELETE CASCADE,
    title         varchar(255)   NOT NULL,
    message       text           NOT NULL,
    created       timestamptz    DEFAULT now(),
    votes         int            DEFAULT 0
);

CREATE UNLOGGED TABLE IF NOT EXISTS post (
    id              serial      NOT NULL PRIMARY KEY,
    parent_id       int         NOT NULL DEFAULT 0,
    user_nickname   citext      NOT NULL REFERENCES users (nickname) ON DELETE CASCADE,
    message         text        NOT NULL,
    is_edited       boolean     NOT NULL DEFAULT false,
    forum_slug      citext      NOT NULL REFERENCES forum (slug) ON DELETE CASCADE,
    thread_id       int         NOT NULL,
    created         timestamptz DEFAULT now(),
    pathTree        int[]       DEFAULT array []::int[]
);

CREATE UNLOGGED TABLE IF NOT EXISTS vote (
    thread_id       int     NOT NULL REFERENCES thread (id) ON DELETE CASCADE,
    user_nickname   citext  NOT NULL REFERENCES users (nickname) ON DELETE CASCADE,
    PRIMARY KEY     (thread_id, user_nickname),
    voice           int     NOT NULL DEFAULT 0
);


CREATE OR REPLACE FUNCTION on_insert_vote() RETURNS trigger AS
$$
BEGIN
    UPDATE thread SET votes = thread.votes + new.voice WHERE id = new.thread_id;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_insert_vote_trigger
    AFTER INSERT
    ON vote
    for each ROW
EXECUTE FUNCTION on_insert_vote();


CREATE OR REPLACE FUNCTION on_update_vote() RETURNS trigger AS
$$
BEGIN
    UPDATE thread SET votes = thread.votes + new.voice - old.voice where id = new.thread_id;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_update_vote_trigger
    AFTER UPDATE
    ON vote
    for each ROW
EXECUTE Function on_update_vote();


CREATE OR REPLACE FUNCTION on_change_counter_posts() RETURNS trigger AS
$$
BEGIN
    UPDATE forum SET posts = forum.posts + 1 WHERE slug = new.forum_slug;
    INSERT INTO forum_users (forum_slug, user_nickname) VALUES (new.forum_slug, new.user_nickname) ON CONFLICT DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_change_counter_posts_trigger
    AFTER INSERT
    ON post
    for each ROW
EXECUTE FUNCTION on_change_counter_posts();


CREATE OR REPLACE FUNCTION on_change_counter_threads() RETURNS trigger AS
$$
BEGIN
    UPDATE forum SET threads = forum.threads + 1 WHERE slug = new.forum_slug;
    INSERT INTO forum_users (forum_slug, user_nickname) VALUES (new.forum_slug, new.user_nickname) ON CONFLICT DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_change_counter_threads_trigger
    AFTER INSERT
    ON thread
    for each ROW
EXECUTE FUNCTION on_change_counter_threads();


CREATE OR REPLACE FUNCTION on_insert_pathTree() RETURNS trigger AS
$$
Declare
    parent_path int[];
begin
    if (new.parent_id = 0) then
        new.pathtree := array_append(new.pathtree, new.id);
    else
        SELECT pathtree FROM post WHERE id = new.parent_id INTO parent_path;
        new.pathtree := new.pathtree || parent_path || new.id;
    END IF;
    RETURN new;
end
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_insert_pathTree_trigger
    BEFORE INSERT
    ON post
    for each ROW
EXECUTE Function on_insert_pathTree();
