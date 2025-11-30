import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `أنت مساعد ذكي متخصص في الفيزياء للطلاب الجزائريين. أنت تعمل لصالح الأستاذ هزيل رفيق.

مهامك:
1. الإجابة على أسئلة الفيزياء بشكل واضح ومفصل
2. شرح المفاهيم الفيزيائية بطريقة مبسطة
3. حل المسائل خطوة بخطوة
4. تقديم أمثلة تطبيقية من الحياة اليومية
5. مساعدة طلاب السنة الثانية ثانوي والبكالوريا

قواعد:
- استخدم اللغة العربية دائماً
- كن صبوراً ومشجعاً
- قدم الإجابات بتنسيق واضح مع استخدام العناوين والنقاط
- إذا كان السؤال خارج نطاق الفيزياء، وجه الطالب بلطف للسؤال عن الفيزياء
- استخدم الرموز الرياضية والفيزيائية عند الحاجة`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إعادة شحن الرصيد للاستمرار في استخدام المساعد الذكي." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "حدث خطأ في الاتصال بالذكاء الاصطناعي" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Physics chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "خطأ غير معروف" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
