"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("../user"));
const flags_1 = __importDefault(require("../flags"));
const flagsApi = module.exports;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
flagsApi.create = (caller, data) => __awaiter(void 0, void 0, void 0, function* () {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const required = ['type', 'id', 'reason'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (!required.every(prop => !!data[prop])) {
        throw new Error('[[error:invalid-data]]');
    }
    const { type, id, reason } = data;
    yield flags_1.default.validate({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        uid: caller.uid,
        type: type,
        id: id,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const flagObj = yield flags_1.default.create(type, id, caller.uid, reason);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    flags_1.default.notify(flagObj, caller.uid);
    return flagObj;
});
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
flagsApi.update = (caller, data) => __awaiter(void 0, void 0, void 0, function* () {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const allowed = yield user_1.default.isPrivileged(caller.uid);
    if (!allowed) {
        throw new Error('[[error:no-privileges]]');
    }
    const { flagId } = data;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    delete data.flagId;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield flags_1.default.update(flagId, caller.uid, data);
    return yield flags_1.default.getHistory(flagId);
});
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
flagsApi.appendNote = (caller, data) => __awaiter(void 0, void 0, void 0, function* () {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const allowed = yield user_1.default.isPrivileged(caller.uid);
    if (!allowed) {
        throw new Error('[[error:no-privileges]]');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (data.datetime && data.flagId) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const note = yield flags_1.default.getNote(data.flagId, data.datetime);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            if (note.uid !== caller.uid) {
                throw new Error('[[error:no-privileges]]');
            }
        }
        catch (e) {
            // Okay if not does not exist in database
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            if (e.message !== '[[error:invalid-data]]') {
                throw e;
            }
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield flags_1.default.appendNote(data.flagId, caller.uid, data.note, data.datetime);
    const [notes, history] = yield Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        flags_1.default.getNotes(data.flagId),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        flags_1.default.getHistory(data.flagId),
    ]);
    return { notes: notes, history: history };
});
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
flagsApi.deleteNote = (caller, data) => __awaiter(void 0, void 0, void 0, function* () {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const note = yield flags_1.default.getNote(data.flagId, data.datetime);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (note.uid !== caller.uid) {
        throw new Error('[[error:no-privileges]]');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield flags_1.default.deleteNote(data.flagId, data.datetime);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield flags_1.default.appendHistory(data.flagId, caller.uid, {
        notes: '[[flags:note-deleted]]',
        datetime: Date.now(),
    });
    const [notes, history] = yield Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        flags_1.default.getNotes(data.flagId),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        flags_1.default.getHistory(data.flagId),
    ]);
    return { notes: notes, history: history };
});
