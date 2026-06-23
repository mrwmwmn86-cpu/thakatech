import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  if (typeof window !== 'undefined') {
    // 1. إعداد خيارات الإعلان
    (window as any).atOptions = {
      'key' : '90f81fb54736863313487c6de6e7d6b2',
      'format' : 'iframe',
      'height' : 60,
      'width' : 468,
      'params' : {}
    };

    // 2. إنشاء السكريبت وحقنه في رأس الصفحة
    const script = document.createElement('script');
    script.src = "https://www.highperformanceformat.com/90f81fb54736863313487c6de6e7d6b2/invoke.js";
    script.async = true;
    document.head.appendChild(script);
  }

  return router;
}
