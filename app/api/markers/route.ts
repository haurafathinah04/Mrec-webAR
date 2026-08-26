import { markerData } from "../../../data/members";

export function GET() {
  return Response.json(markerData);
}