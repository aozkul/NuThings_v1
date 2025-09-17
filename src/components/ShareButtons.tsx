"use client";

import {useMemo} from "react";

export default function ShareButtons({
                                         url,
                                         title,
                                     }: {
    url: string;      // Sunucudan gelen tam URL
    title?: string;   // Opsiyonel başlık (tweet metni vs.)
}) {
    const encodedUrl = useMemo(() => encodeURIComponent(url), [url]);
    const encodedTitle = useMemo(() => encodeURIComponent(title ?? ""), [title]);

    const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    const twitter = `https://twitter.com/intent/tweet?url=${encodedUrl}${encodedTitle ? `&text=${encodedTitle}` : ""}`;

    return (
        <div className="flex gap-2">
            <a href={facebook} target="_blank" rel="noopener noreferrer">Facebook</a>
            <a href={twitter} target="_blank" rel="noopener noreferrer">X (Twitter)</a>
        </div>
    );
}
  