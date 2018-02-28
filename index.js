const request = require('request');
const Google = require('googleapis');
const BUCKET = '[BUCKET_NAME]'; // Replace with name of your bucket

/**
 * Cloud Function.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.validateYoutubeLink = function validateYoutubeLink(req, res) {
    var accessToken = getAccessToken(req.get('Authorization'));
    var oauth = new Google.auth.OAuth2();
    oauth.setCredentials({access_token: accessToken});

    var permission = 'storage.buckets.get';
    var gcs = Google.storage('v1');
    gcs.buckets.testIamPermissions(
        {bucket: BUCKET, permissions: [permission], auth: oauth}, {},
        function (err, response) {
            if (response && response['permissions'] && response['permissions'].includes(permission)) {
                validateYoutube(req,res);
            } else {
                res.status(403).send("Authorisation is not valid.");
            }
        });
};

function validateYoutube(req, res) {

  var url = getUrl(req, res);
  
  var videoID = getIdfromUrl(req, res, url);
    
  isVideoAvailable(req, res, videoID);

};

function getUrl(req, res)
{
  if (!req.body || !req.body.url || req.body.url == '') {
    return res.status(403).send("URL is empty");
  }
  else {
    var url = req.body.url;
    return url;
  }
}

function getIdfromUrl(req, res, url)
{
  var regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  
  var match = url.match(regExp);
  if (match && match[1].length >= 11) {
    var videoID = match[1];
    return videoID;
  }
  else {
    return res.status(400).send("URL is invalid");
  }
}

function isVideoAvailable(req, res, videoId)
{
  var oembed = 'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=' + videoId;

  request(oembed, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      return res.status(200).send("Video is available");
    }
    else {
      return res.status(404).send("Video is not available");
    }
  })
}