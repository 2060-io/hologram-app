# Smoke Test

## Hologram Tests

Next are some of the app basic features must be tested before a release to dev or staging environments

### Signup Section

- [ ] Validate wallet restore works as expected (It can be let it to last becuase may be at this point backup is not created yet)
- [ ] Validate user profile creation works setting name and profile picture

### Scan Section

- [ ] Scan a p2p connection and a service connection (could be this https://gaiaid.io/) using the camera
- [ ] Scan connection using link could be this https://2060.io/i?oob=eyJAdHlwZSI6Imh0dHBzOi8vZGlkY29tbS5vcmcvb3V0LW9mLWJhbmQvMS4xL2ludml0YXRpb24iLCJAaWQiOiJhNDE5ODg2Yy05ZDY0LTRjYjQtODBkNS1jM2Y5ZjRmNWM2YmIiLCJsYWJlbCI6IkRlbW8gQ2hhdGJvdCBBZ2VudCIsImFjY2VwdCI6WyJkaWRjb21tL2FpcDEiLCJkaWRjb21tL2FpcDI7ZW52PXJmYzE5Il0sImhhbmRzaGFrZV9wcm90b2NvbHMiOlsiaHR0cHM6Ly9kaWRjb21tLm9yZy9kaWRleGNoYW5nZS8xLjEiLCJodHRwczovL2RpZGNvbW0ub3JnL2Nvbm5lY3Rpb25zLzEuMCJdLCJzZXJ2aWNlcyI6WyJkaWQ6d2ViOmNoYXRib3QtZGVtby5kZXYuMjA2MC5pbyJdLCJpbWFnZVVybCI6Imh0dHBzOi8vZC5jaGF0Ym90LWRlbW8uZGV2LjIwNjAuaW8vYXZhdGFyLnBuZyJ9

### Services Validation

- [ ] Test proper functioning of services: Demo Chat Bot Agent (https://chatbot-demo.dev.2060.io/invitation) and Digital Trust (https://digital.gov.bc.ca/digital-trust/showcase/demo)

Note: Validate next items using: Demo Chat Bot Agent

- [ ] Receive a credential
- [ ] Receive a proof request (before and after receiving the credential)
- [ ] Question and answer, action menu
- [ ] Invitation to services (did:web:em-vs.demos.2060.io for instance)
- [ ] Invitation to subconnection
- [ ] Links

### Chat Screen

- [ ] Allow to send messages type, video (using camera and video picker), image (using camera and image picker), audio and text between these connections
- [ ] Make a video and audio call between tow p2p connections and validate everything works well
- [ ] Use all features inside chat screen (report, share, save, react to message) and verify other side is notified

### Connection Details Screen

- [ ] Block an connection and verify that can not send messages anymore
- [ ] Unblock connection and verify that can send message again
- [ ] Clear conversation and check chat screen for this connection is now empty
- [ ] Delete connection and verify that can not be found it connections list and can not send messages anymore

### Deep links and Share App Data

- [ ] Test next deep linkings works and are open in app

| Schema  | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| didcomm | didcomm://aries_connection_invitation?c_i=eyJAdHlwZSI6ImRpZDpzb3Y6QnpDYnNOWWhNcmpIaXFaRFRVQVNIZztzcGVjL2Nvbm5lY3Rpb25zLzEuMC9pbnZpdGF0aW9uIiwiQGlkIjoiYzU5MmNmZTEtYjhiZS00ZDQxLWE1NDMtMWI1MTQxODhmMzhhIiwibGFiZWwiOiJBbmltbyIsImltYWdlVXJsIjoiaHR0cHM6Ly9pLmltZ3VyLmNvbS9nM2FiY0NPLnBuZyIsInJlY2lwaWVudEtleXMiOlsiQ3NZQkZBclVjRXk4c0VoWjhRRzI0UHhrZGpXNHpoSDluS3NjY3BUNTV1VjIiXSwic2VydmljZUVuZHBvaW50IjoiaHR0cHM6Ly9kaWRjb21tLmRlbW8uYW5pbW8uaWQiLCJyb3V0aW5nS2V5cyI6W119/                                                                                    |
| https   | https://2060.io/i?oob=eyJAdHlwZSI6Imh0dHBzOi8vZGlkY29tbS5vcmcvb3V0LW9mLWJhbmQvMS4xL2ludml0YXRpb24iLCJAaWQiOiI4Y2MwOTViMS01YmI1LTRjMDYtYjk5NC0zNWIyYzQzZmUyMWUiLCJsYWJlbCI6IkRlbW8gQ2hhdGJvdCBBZ2VudCIsImFjY2VwdCI6WyJkaWRjb21tL2FpcDEiLCJkaWRjb21tL2FpcDI7ZW52PXJmYzE5Il0sImhhbmRzaGFrZV9wcm90b2NvbHMiOlsiaHR0cHM6Ly9kaWRjb21tLm9yZy9kaWRleGNoYW5nZS8xLjEiLCJodHRwczovL2RpZGNvbW0ub3JnL2Nvbm5lY3Rpb25zLzEuMCJdLCJzZXJ2aWNlcyI6WyJkaWQ6d2ViOmNoYXRib3QtZGVtby5kZXYuMjA2MC5pbyJdLCJpbWFnZVVybCI6Imh0dHBzOi8vZC5jaGF0Ym90LWRlbW8uZGV2LjIwNjAuaW8vYXZhdGFyLnBuZyJ9 |

- [ ] Share text, images and videos from other apps (Slack, Signal, Whatsapp, Google Photos, etc) to app

### Conversations Section

- [ ] Filter conversations by type
- [ ] Search connections by name
- [ ] Search a connection and select and send a message
- [ ] Delete, archive, unarchive a conversation

### Wallet Section

- [ ] Check that if a wallet is added it appears in this list (animo, chatbot, etc)
- [ ] Tap a wallet and check all possible information is displayed and delete option works

### Settings Section

##### Backup

- [ ] Check backup info appears if backup exists
- [ ] In Android, choose account for backup and must works as expected
- [ ] Validate correct backup creation

##### Connections

- [ ] A list with all connections must be displayed
- [ ] Can filter connections by name

##### Privacy

- [ ] Disable screen lock and verify is not asking any local auth to open app
- [ ] Set instant screen lock and verify any time I let app and re-open ask for local auth before enter to app
- [ ] set 1 minute screen timeout and verify after 1 minute of inactivity in app local auth screen appears

##### Other settings screen options

- [ ] Touch Settings screen 7 times and see a new option called "Developer" appears
- [ ] In Developer screen change any Environment Values of List and verify change its applied instantly in app
- [ ] Modify profile info (name, and picture)
- [ ] Generate qr code invitation and share to other app
- [ ] In Developer screen press "Delete wallet" button and verify works and let user in SingUp Screen
- [ ] Check delete wallet work and let user in SingUp screen

### Migration

- [ ] Create a wallet in the last dev version prior to the previous staging version, add a P2P contact, exchanging a video, an image and a voice note. Then connect with Chatbot Demo and receive credential/present proof. Upgrade the app to the latest dev version and verify everything keeps working and other messages can be exchanged
