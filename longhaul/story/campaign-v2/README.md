# The Way Back - campaign edition 2

This folder is the new narrative/recording design, separate from the legacy playable campaign. P01-P04 now run through a separate beta adapter under js/campaign/v2; later chapters remain design-only.

Read `00-production-bible.md`, `HANDOFF.md` and `../../CAMPAIGN_IMPLEMENTATION.md` before implementation. The master and JSON contain all 40 missions, 128 scenes and 1,096 spoken IDs including gameplay barks and alternative endings.

Editable narrative/design sources are in `source/`. The reproducible PDF generator and current styled master and actor PDFs are in the user's Documents/longhaul/scripts package and the workspace exports/long-haul-campaign-v2 folder. If changing dialogue, update sources and regenerate JSON, Markdown, CSV and actor files together before a new recording lock. Do not run the old tools/build-campaign.mjs on this master.

The prologue is implemented with its own v2 save/checkpoint slots, towns, road connections and traffic. M01-M36 remain NOT_IMPLEMENTED; record verified progress in HANDOFF.md. Original score cues, voice recordings and final world art are still production assets to obtain. The 43-hour active-play target requires playtesting.
