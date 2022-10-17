


// import { Server } from "hapi";
import * as fs from "fs";
// @ts-ignore
// import jk from "./utils/jkurwa/lib/index.js";
jk.b64_encode('Hello world!');
// const jk = require('./utils/jkurwa/lib/index.js');

// const getSignatureInfoIIT = async (signature) => {
//     // Check params.
//     if (typeof signature !== 'string') {
//         throw new Error(Errors.List.SIGNATURE_NOT_FOUND.message);
//     }
//
//     // Check EDS.
//     let message;
//     try {
//         message = new models.Message(b64_decode(signature));
//         // if (await this.verifySign(signature) === false) {
//         //   throw new Error();
//         // }
//     } catch (err) {
//         throw new Error(Errors.List.INCORRECT_SIGN.message);
//     }
//     let cert;
//     try {
//         // cert = await new Promise((resolve, reject) => {
//         //   setTimeout(() => { return reject(); }, 5000);
//         //   setImmediate(() => { return resolve(message && message.signer()); });
//         // });
//
//         cert = message && message.signer();
//     } catch (error) {
//         console.error(error);
//         throw new Error(Errors.List.CAN_NOT_DECODE_CERT.message);
//     }
//     if (typeof cert === 'undefined') {
//         throw new Error(Errors.List.CAN_NOT_FIND_CERT.message);
//     }
//     const content = message.info && message.info.contentInfo && message.info.contentInfo.content;
//     if (!content) {
//         throw new Error(Errors.List.CAN_NOT_DEFINE_SIGNED_CONTENT.message);
//     }
//     const pem = cert && cert.as_pem();
//     if (!pem) {
//         throw new Error(Errors.List.CAN_NOT_GET_CERT_AS_PEM.message);
//     }
//
//     // Get signer data from EDS.
//     const ipn = cert.extension && cert.extension.ipn;
//     const normalizedIpn = this.normalizeIpn(ipn);
//     const signer = { ...cert.subject, ipn, normalizedIpn };
//     const issuer = cert.issuer;
//     const serial = cert.serial.toJSON().toUpperCase();
//
//     // Return cert info.
//     const certInfo = { signer, issuer, serial, content, pem };
//     log.save('get-signature-info-sertificate-data', { signer, issuer, serial, content, pem }, 'info');
//     return certInfo;
// }

const init = async (): Promise<any> => {

    const server = new Server({
        port: 3000,
        host: 'localhost'
    });

    server.route({
        method: 'POST',
        path: '/api',
        options: {
            payload: {
                allow: ["multipart/mixed", "multipart/form-data", "application/json"],
                output: 'stream',
                parse: true
            }
        },
        handler: (request, h) => {
            request.payload.on('data', (d) => {
                const data = JSON.parse(d.toString());
                const { signature } = JSON.parse(Buffer.from(data.data, 'base64').toString('utf8'));
                const signatureString = Buffer.from(signature,'base64').toString('utf8');
                fs.writeFileSync('signature.p7s', signature);
                const regexInn = /(?<=TINUA-)[0-9]{10}/;
                const regexFullName = /(?<=,).*(?=1)/;
                const [ inn ] = signatureString.match(regexInn);
                const [name] = signatureString.match(regexFullName);
                console.log(inn);
                console.log(name);
                // SignData(Buffer.from(data.data, 'base64'));
              return d.toString();
            })

            return 'Hello aaaaaa!';
        }
    });


    await server.start();
    console.log('Server running on %s', server.info.uri);
};

// process.on('unhandledRejection', (err) => {
//
//     console.log(err);
//     process.exit(1);
// });

init();