// "use client";
// import { pdfjs } from "react-pdf";
// import { Viewer, Worker } from "@react-pdf-viewer/core";
// import { thumbnailPlugin } from "@react-pdf-viewer/thumbnail";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import disableScrollPlugin from "./disableScrollPlugin";

// const PDFPreview = ({ pdfUrl }: { pdfUrl: string }) => {
//   const disableScrollPluginInstance = disableScrollPlugin();
//   const thumbnailPluginInstance = thumbnailPlugin();

//   return (
//     <Worker
//       workerUrl={`//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`}
//     >
//       <ScrollArea className="h-full max-h-52 w-full !p-0 bg-muted rounded-md">
//         <Viewer
//           fileUrl={pdfUrl}
//           plugins={[thumbnailPluginInstance, disableScrollPluginInstance]}
//           initialPage={0}
//         />
//       </ScrollArea>
//     </Worker>
//   );
// };

// export default PDFPreview;
