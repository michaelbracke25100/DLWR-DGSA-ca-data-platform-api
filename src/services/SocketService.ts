// import {WebSocket} from 'ws';
// import {websocket_message} from '../schemas/websocket';
// import {PipelineRunState} from '../db/pipeline_run.entity';
// import PipelineRunEntityService from './PipelineRunEntityService';

// class SocketService {
//   private websocket: WebSocket;
//   private ca_joborchestrator_url: string;
//   constructor(ca_joborchestrator_url: string) {
//     this.ca_joborchestrator_url = ca_joborchestrator_url;
//   }

//   //TODO Add Authorization header (new App Registration?)
//   connect(pipelinerun_entity_service: PipelineRunEntityService) {
//     this.websocket = new WebSocket(this.ca_joborchestrator_url);

//     this.websocket.on('open', () => {
//       console.log('Connected to the WebSocket server');
//     });

//     this.websocket.on('message', message => {
//       const websocket_message: websocket_message = JSON.parse(message.toString());
//       console.log(`Message received: ${websocket_message}`);
//       pipelinerun_entity_service.updatePipelineRunState(websocket_message.run_id, websocket_message.state as PipelineRunState);
//     });

//     this.websocket.on('close', () => {
//       console.log('Disconnected from the WebSocket server');
//     });

//     this.websocket.on('error', error => {
//       console.error(`WebSocket error: ${error}`);
//     });
//   }
// }

// export default SocketService;
