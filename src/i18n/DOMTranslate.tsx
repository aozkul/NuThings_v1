"use client";
import {useEffect} from "react";
import {useI18n} from "@/src/i18n/provider";
import trMessages from "../../messages/tr.json";

type Dict = Record<string, string>;

function buildDict(current: any): Dict {
    const dict: Dict = {};
    const trCommon = (trMessages as any)?.common || {};
    const curCommon = (current as any)?.common || {};
    for (const key of Object.keys(trCommon)) {
        const trVal = String(trCommon[key] ?? "").trim();
        const curVal = String(curCommon[key] ?? "").trim();
        if (trVal && curVal && trVal !== curVal) {
            dict[trVal] = curVal; // TR → seçili dil eşleşmesi
        }
    }
    return dict;
}

export default function DOMTranslate() {
    const {messages, locale} = useI18n();

    useEffect(() => {
        try {
            const dict = buildDict(messages);
            if (!dict || Object.keys(dict).length === 0) return;

            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            const toUpdate: Text[] = [];
            let node: any;
            while ((node = walker.nextNode())) {
                const txt = node.nodeValue?.trim();
                if (!txt) continue;
                if (dict[txt]) toUpdate.push(node as Text);
            }

            for (const n of toUpdate) {
                const original = n.nodeValue || "";
                const stripped = original.trim();
                const translated = dict[stripped];
                if (translated) {
                    const prefix = original.startsWith(" ") ? " " : "";
                    const suffix = original.endsWith(" ") ? " " : "";
                    n.nodeValue = prefix + translated + suffix;
                }
            }
        } catch (e) {
            console.error("DOMTranslate error", e);
        }
    }, [messages, locale]);

    return null;
}
