// module.exports = {
function putFile(file, name, gfs) {
    const writestream = gfs.createWriteStream({
        filename: name,
        mode: 'w',
        content_type: 'application/pdf'
    });
    writestream
        .on('close', () => { })
        .on('error', (err) => { return { "error": "Error uploading files " + err } });

    writestream.write(file.data);
    writestream.end();
    return "Success";
    // fs.createReadStream(path).pipe(writestream);
}

function getFile(name, gfs, res, callback) {
    try {
        const readStream = gfs.createReadStream({
            filename: name,
        }).on('error', function (err) {
            callback(res, { "error": err })
        })

        const bufs = [];
        readStream.on('data', function (chunk) {
            bufs.push(chunk);
        });
        readStream.on('end', function () {
            const fbuf = Buffer.concat(bufs);
            const base64 = fbuf.toString('base64');
            callback(res, { "data": base64 })
        });
    } catch (err) {
        callback(res, { "error": err });
    }
}

function deleteFile(name, gfs, res, mongoose, callback) {
    gfs.files.find({ filename: name }).toArray(function (err, files) {
        if (err)
            callback(res, { "error": err });
        else {
            const id = files[0]._id

            gfs.db.collection('fs.chunks').remove({ files_id: mongoose.Types.ObjectId(id) }, function (err) {
                if (err)
                    callback(res, { "error": err });
                else {
                    gfs.files.remove({ _id: mongoose.Types.ObjectId(id) }, async function (err) {
                        if (err)
                            callback(res, { "error": err })
                        else
                            callback(res, { "data": "done" })
                    })
                }
            })
        }
    })
}

function returnGetFileResponse(res, response) {
    if (response.error)
        res.status(500).send(response);
    else res.status(200).send(response);
}

function returnDeleteFileResponse(res, response) {
    if (response.error)
        res.status(500).send(response);
    else res.status(200).send(response)
}
// }
module.exports = {
    putFile,
    getFile,
    deleteFile,
    returnDeleteFileResponse,
    returnGetFileResponse
};