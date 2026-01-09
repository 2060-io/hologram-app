# Smoke Test

## Hologram Tests

Next are some of the app basic features must be tested before a release to dev or staging environments

### Signup Section

- [ ] Validate user profile creation works setting name and profile picture

### Scan Section

- [ ] Scan connection using link could be this (Gov ID Issuer) https://hologram.zone/?oob=eyJAdHlwZSI6Imh0dHBzOi8vZGlkY29tbS5vcmcvb3V0LW9mLWJhbmQvMS4xL2ludml0YXRpb24iLCJAaWQiOiI5NDI4NWMxZC1mYWRiLTQ4Y2MtOWFjNy1kOTU0NjZlYzNlMTciLCJsYWJlbCI6IkdvdiBJRCBJc3N1ZXIiLCJhY2NlcHQiOlsiZGlkY29tbS9haXAxIiwiZGlkY29tbS9haXAyO2Vudj1yZmMxOSJdLCJoYW5kc2hha2VfcHJvdG9jb2xzIjpbImh0dHBzOi8vZGlkY29tbS5vcmcvZGlkZXhjaGFuZ2UvMS4xIiwiaHR0cHM6Ly9kaWRjb21tLm9yZy9jb25uZWN0aW9ucy8xLjAiXSwic2VydmljZXMiOlsiZGlkOndlYjpkbS5nb3YtaWQtaXNzdWVyLmRlbW9zLjIwNjAuaW8iXSwiaW1hZ2VVcmwiOiJodHRwczovL3Jlc291cmNlcy5kZW1vcy4yMDYwLmlvL2dvdi1pZC1pc3N1ZXIucG5nIn0

### Services Validation

- [ ] Test proper functioning of services: Demo Chat Bot Agent (https://dm.chatbot.demos.dev.2060.io/qr) and complete BCGov flow (https://digital.gov.bc.ca/digital-trust/showcase/)

Note: Validate next items and commands using: Demo Chat Bot Agent

- [ ] Receive a proof request (before and after receiving the credential)
- [ ] Receive a credential
- [ ] Question and answer, action menu
- [ ] Invitation to services. Send next message: /invitation did:web:em-vs.demos.2060.io
- [ ] Invitation to subconnection. Send next message: /invitation this_is_a_child_connection
- [ ] Web view. Send next message: /link https://hologram.zone/ Hologram zone https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSfGMjlS818F78B84hXGsf9DAFmNpMfmx0fA&s

### Chat Screen

- [ ] Allow to send messages type, video (using camera and video picker), image (using camera and image picker), audio and text between these connections
- [ ] Make a video and audio call between tow p2p connections and validate everything works well (Must be enabled developer mode in both apps where two connections are going to be on the call)
- [ ] Use all features inside chat screen (report, share, save, react to message) and verify other side is notified

### Connection Details Screen

- [ ] Block an connection and verify that can not send messages anymore
- [ ] Unblock connection and verify that can send message again
- [ ] Clear conversation and check chat screen for this connection is now empty
- [ ] Delete connection and verify that can not be found it connections list and can not send messages anymore
- [ ] In a Service connection details Forward and Share it to another connection (p2p). Now, in this receiver coonection accept invitation and verify connection is correctly stableshid

### Deep links, Share App Data and Verana Demo

- [ ] Test next deep linkings works and are open in app

| Schema  | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| didcomm | didcomm://aries_connection_invitation?c_i=eyJAdHlwZSI6ImRpZDpzb3Y6QnpDYnNOWWhNcmpIaXFaRFRVQVNIZztzcGVjL2Nvbm5lY3Rpb25zLzEuMC9pbnZpdGF0aW9uIiwiQGlkIjoiYzU5MmNmZTEtYjhiZS00ZDQxLWE1NDMtMWI1MTQxODhmMzhhIiwibGFiZWwiOiJBbmltbyIsImltYWdlVXJsIjoiaHR0cHM6Ly9pLmltZ3VyLmNvbS9nM2FiY0NPLnBuZyIsInJlY2lwaWVudEtleXMiOlsiQ3NZQkZBclVjRXk4c0VoWjhRRzI0UHhrZGpXNHpoSDluS3NjY3BUNTV1VjIiXSwic2VydmljZUVuZHBvaW50IjoiaHR0cHM6Ly9kaWRjb21tLmRlbW8uYW5pbW8uaWQiLCJyb3V0aW5nS2V5cyI6W119/                                                                                         |
| https   | https://hologram.zone/?oob=eyJAdHlwZSI6Imh0dHBzOi8vZGlkY29tbS5vcmcvb3V0LW9mLWJhbmQvMS4xL2ludml0YXRpb24iLCJAaWQiOiIwYWI1Mzc4YS05YzM4LTRlZWYtYWM0Yy1iZGE1MWJjMDY0ODYiLCJsYWJlbCI6IkRlbW8gQ2hhdGJvdCBBZ2VudCIsImFjY2VwdCI6WyJkaWRjb21tL2FpcDEiLCJkaWRjb21tL2FpcDI7ZW52PXJmYzE5Il0sImhhbmRzaGFrZV9wcm90b2NvbHMiOlsiaHR0cHM6Ly9kaWRjb21tLm9yZy9kaWRleGNoYW5nZS8xLjEiLCJodHRwczovL2RpZGNvbW0ub3JnL2Nvbm5lY3Rpb25zLzEuMCJdLCJzZXJ2aWNlcyI6WyJkaWQ6d2ViOmNoYXRib3QtZGVtby5kZXYuMjA2MC5pbyJdLCJpbWFnZVVybCI6Imh0dHBzOi8vZC5jaGF0Ym90LWRlbW8uZGV2LjIwNjAuaW8vYXZhdGFyLnBuZyJ9 For this url app show display toast error indicating could not process invitation|

- [ ] Share text, images and videos from other apps (Slack, Signal, Whatsapp, Google Photos, etc) to app


### Chats Screen

- [ ] Filter conversations by type
- [ ] Search connections by name
- [ ] Search a connection and select and send a message
- [ ] Delete, archive, unarchive a conversation

### Wallet Screen

- [ ] Check that if a credential is added it appears in this list (BCGov, chatbot, gaia etc)
- [ ] Tap a credential and check all possible information is displayed and delete option works
- [ ] Tab a credential and in credential details screen press button "Present credential" and then press button "Present to connection(s)". Now, in approver(receiver) side Accept this credential presentation and check status changes to "Accepted" in both sides. Also, in approver(receiver) side press Credential Card and verify main credential details and claims with its values are displayed
- [ ] Tab a credential and in credential details screen press button "Present credential" and then press button "Present to connection(s)". Now, in receiver side Refuse credential presentation and check status changes to "Refused" in both sides.
- [ ] Tab a credential and in credential details screen press button "Present credential" and then press button "Create QR code". Now using another device scan this QR using Hologram app and Accept this credential presentation. After that, check that both prover and verifier see on its screens updated info with accepted credential presentation
- [ ] Tab a credential and in credential details screen press button "Present credential" and then press button "Create QR code". Now using another device scan this QR using Hologram app and Refuse this credential presentation. After that, check that both prover and verifier see on its screens updated with rejected credential presentation

### Settings Section

##### Connections

- [ ] A list with all connections must be displayed
- [ ] Can filter connections by name

##### Privacy and data usage

- [ ] Disable screen lock and verify is not asking any local auth to open app
- [ ] Set instant screen lock and verify any time I let app and re-open ask for local auth before enter to app
- [ ] set 1 minute screen timeout and verify after 1 minute of inactivity in app local auth screen appears

##### Parental Control

- [ ] Press switch to enable Parental Control and set PIN
- [ ] Press Kid birtday value box and set an age that does not be older to 18 years for kid
- [ ] Go to Scan screen, scan next service https://dm.gov-id-issuer.demos.dev.2060.io/qr and verify that due to age restriccions user can not connect to this service

##### Other settings screen options

- [ ] Touch Settings screen 7 times and see a new option called "Developer" appears
- [ ] Modify profile info (name, and picture)
- [ ] Generate qr code invitation and share to other app
- [ ] Scan your invitation QR with another device and after connect with it scan this same QR once again in the same device and a popup indicating "You are already connected..." must appear
- After previous test in Invitation screen press "Refresh" button and QR should be updated. After that, scan this new QR in same device you scan previous QR and now you should be able to connect with it as if it were a new connection
- [ ] Check delete wallet work and let user in SingUp screen (Do this after creation of wallet backup)

##### Backup (Must be enabled developer mode to see it)

- [ ] Check backup info appears if backup exists
- [ ] In Android, choose account for backup and must works as expected
- [ ] Validate correct backup creation

#### Developer

- [ ] Change any Environment Values of List and verify change its applied instantly in app
- [ ] Press "Delete wallet" button and verify works and let user in SingUp Screen

### Wallet restore

- [ ] Validate wallet restore works as expected

### Wallet restore with Migration

It is recommended for this Migration to have a chat o several chats where user has almost all types of possible messages. This is due to chat entries model can change over time so testing this migration with all possible kind of messages makes this migration test coverage more reliable

- [ ] Create a wallet in the last dev version prior to the previous staging version, add a P2P contact, exchanging a video, an image and a voice note. Then connect with Chatbot Demo and receive credential/present proof. Upgrade the app to the latest dev version and verify everything keeps working and more messages can be exchanged
