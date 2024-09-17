## Media files

Hologram supports three basic types of media files:

- Images
- Voice notes
- Videos


### Media sharing procedure

These files are shared to other parties by using DIDComm [Media Sharing](https://didcomm.org/media-sharing/1.0/) protocol, with the help of [2060 Data Store API](https://github.com/2060-io/2060-datastore) (TODO: Ref needed).

The procedure to share a media file consists of the following steps:

1. **File creation**: this depends on the nature of the file. For instance, an image can be created from the camera or the gallery. A voice note is recorded from microphone. Each kind of file is adapted (e.g. resized, compressed, etc.) in order for it to be optimized for sharing in a chat session
2. **File encryption**: before being uploaded, files are encrypted using a symmetric key
3. **File upload**: Hologram uploads files to a Data Store instance hosted by 2060. If they are too large, they are split into chunks in order to be  easily resumable in case of network unstabilities
4. **File sharing**: once the file has a public URI that let other parties to access its contents, its retrieval details are shared through DIDComm

Let's see these steps in more details.

#### File creation

As explained above, file creation depends on the flow where they come. We support different types of sources for file creation:

- Media Picker (images and videos from camera or gallery): they are usually compressed and copied into a provisional, temporary local path
- Voice recorder: they are also saved into a temporary local path
- Shared from other apps: images and videos coming from other apps. These files are not currently converted into a format suitable for sharing through DIDComm, so they are copied into temporary local path as they come from their original source

Prior to be uploaded, all media files are stored into a local directory under `./media`, under the naming: [prefix]-[date]-[uuid].[extension], where:

- Prefix: depending on media type: IMG for images, VID for videos, AUD for voice notes
- Date: share date in YYYYMMDD format
- UUID: an unique 6 digit identifier
- Extension: file extension (e.g. MP4, JPEG, PNG, etc.)

At this point, some useful file metadata is retrieved. This information is mainly intended to share to other parties at [File sharing](#file-sharing) step, in order to let them know details about the file before downloading them. For instance:

- Original file name (useful to know its extension) and media type
- File width and height (helps to the recipient agent to pre-calculate image container dimensions)
- Media duration
- A low-quality image preview (thumbnail in case of videos)

In addition, in case of images and videos, a local preview (TODO: local preview specification)is also generated for quickly displaying within the conversation they belong. These previews are JPEG images stored in `./media/previews`. Such files are for local usage only (i.e. not shared with the other party).

#### File encryption

Ciphering is currently done by using an AES-256-CBC cipher, for which a 256-bit key and 128-bit initialization vector (IV) are created on-the-fly.

Each uploaded file has its own key/IV pair.

#### File upload

Once the file is encrypted, it is split into chunks up to 2 MB long.

Then, Data Store resource is created (using `c` endpoint) and each chunk is uploaded (using `u` endpoint).

#### File sharing

Finally, when all chunks of a given media are properly uploaded, the file is now available for sharing through DIDComm. This process involves sending a DIDComm message per each connection the user wants to share the media file to. All recipients will receive a media item whose download URI is exactly the same.

#### Implementation

Uploads are managed by `FileUploadDownloadProvider`, who takes care of both file uploads and downloads and provides some methods to fire up and follow up them.

In this case, `startMediaUpload` is called, providing the following options:

- `didcommConnectionIds`: an array containing all the target DIDComm connection IDs for this media share
- `didcommThreadId`: optional DIDComm parent thread ID for this share. This will be used to determine the message it is replying to (if any)
- `didcommMediaFileSharingData`: information about the input file, adding metadata to share with the other party 

This method will do several things, such as:

1. Assign an unique id to this new file upload
2. Move original file contents into local media directory (using a normalized name)
3. Encrypt file
4. Create file chunks
5. Create a local preview (in case of images and videos)
6. Create an Agent's media record per each target DIDComm connection
7. Create a new `UploadTask` that will be associated to:
    - The unique id for the file upload
    - All created file chunks, each with an individual 'chunk upload task'
    - All created media records
8. Create the resource in Data Store (endpoint `c`)
9. Start the first chunk upload (endpoint `u`).


Once this process is launched, FileUploadDownloadProvider will listen to events from `react-native-background-upload`'s `Upload` object in order to continue the flow. When a chunk is completed (`onUploadComplete`), we check two situations: 

- If not every chunk has been uploaded, overall media progress is increased (uploaded number of chunks / total number of chunks)
- If all chunks have been uploaded, we consider the task as finished and therefore create an `AgentAction` to effectively share the media through DIDComm. At this point, the `UploadTask` is deleted and if any issue appears while sharing the info with any of the recipients, a separate retry mechanism will be triggered (as it happens with other DIDComm messages)

Let's see some more details about each step, including some comments regarding the implementation.

### Media reception

In order to receive media from other DIDComm Agents, the opposite procedure is followed:

1. **Media info reception**: media info is received through DIDComm, where important details such as download URI and file metadata are specified
2. **File download**: a regular HTTP file download into a temporary directory
3. **File decryption**: file is decrypted using the ciphering metadata received in the DIDComm message

#### Media info reception

Upon the reception of a Media Sharing message, Credo triggers an event that is handled by `handleMediaSharingRecordChanges` and effectively creates the corresponding chat entry. At the moment, Hologram does not support automatic downloading of the file, so the user needs to select it manually.

#### File download and decryption

As stated above, `FileUploadDownloadProvider` also provides methods for file downloading. Currently it exposes `downloadMediaFile`, which receives Agent's media record id as parameter and does all that is needed to properly display the media in the app:

1. Assigns an unique local file name, based on the media type and original file extension
2. Downloads the encrypted file into a temporary file path
3. Decrypts the file using the ciphering metadata. Now the encrypted file can be deleted
4. Creates a local preview (in case of images and videos)
5. Updates the associated Agent's media sharing record with the local file and preview paths, so the corresponding Chat Entry is updated
 