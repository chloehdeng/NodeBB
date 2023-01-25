import user = require('../user');
import flags = require('../flags');

interface flag {
    create: object,
    update: object,
    appendNote: object,
    deleteNote: object,
    notify: object
}

interface dataType {
    type: string,
    id: number,
    reason: string
    flagId: number
    note: string,
    datetime: Date
}

interface callerType {
    uid: number
}

interface noteType {
    uid: number
}

const flagsApi:flag = module.exports;
flagsApi.create = async (caller: callerType, data: dataType) => {
    const required = ['type', 'id', 'reason'];
    if (!required.every(prop => !!data[prop])) {
        throw new Error('[[error:invalid-data]]');
    }

    const { type, id, reason } = data;

    await flags.validate({
        uid: caller.uid,
        type: type,
        id: id,
    });

    const flagObj:flag = await flags.create(type, id, caller.uid, reason);
    flags.notify(flagObj, caller.uid);

    return flagObj;
};

flagsApi.update = async (caller: callerType, data: dataType) => {
    const allowed:boolean = await user.isPrivileged(caller.uid);
    if (!allowed) {
        throw new Error('[[error:no-privileges]]');
    }

    const { flagId } = data;
    delete data.flagId;

    await flags.update(flagId, caller.uid, data);
    return await flags.getHistory(flagId);
};

flagsApi.appendNote = async (caller: callerType, data: dataType) => {
    const allowed:boolean = await user.isPrivileged(caller.uid);
    if (!allowed) {
        throw new Error('[[error:no-privileges]]');
    }

    if (data.datetime && data.flagId) {
        try {
            const note = await flags.getNote(data.flagId, data.datetime);
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            if (note.uid !== caller.uid) {
                throw new Error('[[error:no-privileges]]');
            }
        } catch (e) {
            // Okay if not does not exist in database
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            if (e.message !== '[[error:invalid-data]]') {
                throw e;
            }
        }
    }
    await flags.appendNote(data.flagId, caller.uid, data.note, data.datetime);
    const [notes, history] = await Promise.all([
        flags.getNotes(data.flagId),
        flags.getHistory(data.flagId),
    ]);
    return { notes: notes, history: history };
};

flagsApi.deleteNote = async (caller: callerType, data: dataType) => {
    const note: noteType = await flags.getNote(data.flagId, data.datetime);
    if (note.uid !== caller.uid) {
        throw new Error('[[error:no-privileges]]');
    }

    await flags.deleteNote(data.flagId, data.datetime);

    await flags.appendHistory(data.flagId, caller.uid, {
        notes: '[[flags:note-deleted]]',
        datetime: Date.now(),
    });

    const [notes, history] = await Promise.all([
        flags.getNotes(data.flagId),
        flags.getHistory(data.flagId),
    ]);
    return { notes: notes, history: history };
};
