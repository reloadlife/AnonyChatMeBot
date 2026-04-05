// Cloudflare Workflows boilerplate
// https://developers.cloudflare.com/workflows/

// Uncomment and extend when @cloudflare/workers-types ships WorkflowEntrypoint
// import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers"
// import type { Bindings } from "../index"

// type DeliveryParams = {
//   messageId: number
// }

// export class DeliveryWorkflow extends WorkflowEntrypoint<Bindings, DeliveryParams> {
//   async run(event: WorkflowEvent<DeliveryParams>, step: WorkflowStep) {
//     const { messageId } = event.payload
//     await step.do("deliver-message", async () => {
//       // delivery logic here
//     })
//   }
// }

export {}
