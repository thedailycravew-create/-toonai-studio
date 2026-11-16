export default {
 async fetch(request, env) {

  const url = new URL(request.url);

  const headers = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Methods": "POST, OPTIONS",
   "Access-Control-Allow-Headers": "Content-Type"
  };

  if(request.method === "OPTIONS"){
   return new Response(null,{headers});
  }

  if(request.method !== "POST"){
   return new Response("Not found",{status:404});
  }

  const type = url.pathname;

  if(type !== "/api/image" && type !== "/api/video"){
   return new Response("Not found",{status:404});
  }

  try{
   const data = await request.json();
   const prompt = String(data.prompt || "").trim();

   if(!prompt || prompt.length > 1500){
    return Response.json(
     {error:"Please enter a prompt under 1500 characters."},
     {status:400,headers}
    );
   }

   if(!env.POLLINATIONS_API_KEY){
    return Response.json(
     {error:"API key is not configured on the server."},
     {status:500,headers}
    );
   }

   const isImage = type === "/api/image";

   const finalPrompt = isImage
    ? prompt + ", beautiful high quality 3D cartoon animation, cute characters, cinematic lighting, colourful"
    : prompt + ", family friendly 3D animated cartoon movie, cinematic scenes";

   const model = isImage
    ? "black-forest-labs/flux.1-schnell"
    : "google/veo-3.1-fast";

   const endpoint = isImage ? "image" : "video";

   const api = new URL(
    "https://gen.pollinations.ai/" +
    endpoint + "/" +
    encodeURIComponent(finalPrompt)
   );

   api.searchParams.set("model",model);

   if(!isImage){
    api.searchParams.set("duration","30");
   }

   const result = await fetch(api,{
    headers:{
     "Authorization":"Bearer "+env.POLLINATIONS_API_KEY
    }
   });

   if(!result.ok){
    const errorText = await result.text();

    return Response.json({
     error:"AI provider error: "+errorText.slice(0,400)
    },{
     status:result.status,
     headers
    });
   }

   return new Response(result.body,{
    headers:{
     ...headers,
     "Content-Type":
      result.headers.get("Content-Type") ||
      (isImage ? "image/jpeg" : "video/mp4")
    }
   });

  }catch(error){
   return Response.json({
    error:error.message
   },{
    status:500,
    headers
   });
  }
 }
};
