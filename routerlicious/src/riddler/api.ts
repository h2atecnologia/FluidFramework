import { Router } from "express";
import * as jwt from "jsonwebtoken";
import * as winston from "winston";
import { IAuthenticatedUser } from "../core-utils";
import * as utils from "../utils";

interface IDecodedToken {
    user: any;
    tenantid: string;
    secret: string;
    permission: string;
}

// TODO (mdaumi): This map will be populated from mongo.
let tenantKeyMap: { [tenandId: string]: string} = {};
const t1 = "prague";
const t2 = "linkedin";
const t3 = "git";
tenantKeyMap[t1] = "secret_key";
tenantKeyMap[t2] = "secret_key_2";
tenantKeyMap[t3] = "secret_key";

async function verifyToken(token: string, hashKey: string): Promise<IAuthenticatedUser> {
    return new Promise<IAuthenticatedUser>((resolve, reject) => {
        winston.info(`Token to verify: ${token}`);
        jwt.verify(token, hashKey, (err, decoded: IDecodedToken) => {
            if (err) {
                winston.info(`Token verification error: ${JSON.stringify(err)}`);
                reject(err);
            }
            if (tenantKeyMap[decoded.tenantid] !== decoded.secret) {
                winston.info(`Token verification error: Wrong secret key!`);
                reject(`Wrong secret key!`);
            }
            winston.info(`Decoded token: ${JSON.stringify(decoded)}`);
            resolve({
                permission: decoded.permission,
                tenantid: decoded.tenantid,
                user: decoded.user,
            });
        });
    });
}

export function create(collectionName: string, mongoManager: utils.MongoManager, hashKey: string): Router {
    const router: Router = Router();

    /**
     * Verifies the passed token and matches with DB.
     */
    router.post("/", (request, response, next) => {
        verifyToken(request.body.token, hashKey).then((data: IAuthenticatedUser) => {
            response.status(200).json(data);
        }, (err) => {
            response.status(500).json(err);
        });
    });

    return router;
}
