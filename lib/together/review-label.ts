// Activities that have not been through professional review carry a notice.
// Inside a facilitated test session (a valid event code, checked by the server)
// the notice is left off so it does not colour first reactions; the facilitator
// says so aloud instead. Reviewed content always shows its status.
export function showsReviewLabel(reviewStatus:string,eventPreview:boolean|undefined){
 return reviewStatus==='reviewed'||eventPreview!==true;
}
