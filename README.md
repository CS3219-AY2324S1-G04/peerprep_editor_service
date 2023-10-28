# PeerPrep Editor Service

Provides the mechanism for real-time collaboration (e.g. concurrent code editing) between the authenticated and matched users in the collaborative space.

## Table of Contents

- [PeerPrep Editor Service](#peerprep-editor-service)
  - [Table of Contents](#table-of-contents)
  - [Requirements](#requirements)
  - [Quick Start](#quick-start)
  - [Environment Variables](#environment-variables)
  - [Todo](#todo)

## Requirements

Editor Service requires the following services to operate correctly.

- [User Service](https://github.com/CS3219-AY2324S1-G04/peerprep_user_service)
- [Question Service](https://github.com/CS3219-AY2324S1-G04/peerprep_question_service)
- [Matching Service](https://github.com/CS3219-AY2324S1-G04/peerprep_matching_service)
- [Room Service](https://github.com/CS3219-AY2324S1-G04/peerprep_room_service)

## Quick Start

1. Clone this repository.
2. Configure the `.env` file (Refer to [Environment Variables](#environment-variables))
2. Build and run the docker container. `docker compose up -d`

## Environment Variables

| Variable Name | Default Value | Description |
| ------------- | ------------- | ----------- |
| EDITOR_SERVICE_PORT | 9004 | The port used to bind the websocket server. |
| SERVICE_ROUTE | /editor-service | Endpoint for receiving messages. |

## Todo

- Include documentation for frontend Editor component.
