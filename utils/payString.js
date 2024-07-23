const crypto = require('crypto');

function getPayString(string){
    const keyIndex = 1;
    // const string = `/pg/v1/status/${merchantId}/${merchantTrxnId}` + saltKey;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + "###" + keyIndex;

    return checksum;
}

module.exports = getPayString;
