// module.exports = {
function putFile(file, name, gfs) {
    const writestream = gfs.createWriteStream({
        filename: name,
        mode: 'w',
        content_type: 'application/pdf'
    });
    console.log(writestream)
    writestream
        .on('close', () => { })
        .on('error', (err) => { return { "error": "Error uploading files " + err } });

    writestream.write(file.data);
    writestream.end();
    return "Success";
    // fs.createReadStream(path).pipe(writestream);
}

function getFile(name, gfs) {
    var file = gfs.files.find({filename: name});

    var readStream = gfs.createReadStream({
        filename: file.filename,
    });
    return readStream;
}
// }
module.exports = {
    putFile,
    getFile
};