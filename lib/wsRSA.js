const NodeRSA = require('node-rsa');
const fs = require('fs');
const path = require('path');

module.exports = (str,privatePem) => {
    return new Promise((res, rej) => {
        try {
            let privateKey = new NodeRSA(privatePem);
            let rsa_ciphertext = privateKey.encryptPrivate(str, 'base64', 'utf8');
            res(rsa_ciphertext);
        } catch (e) {
            rej(e);
        }
    });
}