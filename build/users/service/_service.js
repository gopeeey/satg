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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
class UserService {
    constructor(deps) {
        this._repo = deps.repo;
    }
    // Gets a user by id and throws an error if not found
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this._repo.getUserById(id);
            if (!user)
                throw new Error("User not found");
            return user;
        });
    }
    // Gets a user by id
    // Creates and returns a new user if not found or id isn't provided
    getOrCreateUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!id)
                return yield this._repo.createUser();
            let user = yield this._repo.getUserById(id);
            if (!user)
                return yield this._repo.createUser();
            return user;
        });
    }
}
exports.UserService = UserService;
