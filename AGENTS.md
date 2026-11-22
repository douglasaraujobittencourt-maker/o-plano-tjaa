<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use the semantic global theme tokens for the official navy and neon-green visual system; this keeps every screen consistent and exportable.
- Keep mobile navigation in a normal-flow header in the shared authenticated shell so every planner section reserves space for its controls.
- Use the shared Embla-based progress carousel for overview progress panels; native table scrolling remains available on narrow screens.
- Derive global study-hour totals from session minutes using the shared study-metrics helpers, never from rounded per-subject totals; this includes every modality and unassigned sessions exactly once.
- Render the brand wordmark through the shared OPlanoWordmark component (inline SVG asset) so its letters follow the surrounding text colour; keep raster brand images in public/ so they resolve on any host.
- Keep exam-logo uploads in the existing authenticated browser client, with owner-prefixed unique Storage paths and profile URL updates before old-file cleanup; this preserves the external account boundary and prevents destructive replacement failures.
- Keep personal photos independent from exam logos: update only profiles.avatar_url through the existing browser client, save before deleting the previous owner-scoped avatar, and configure buckets through the Storage API so logo data and external accounts remain untouched.
- Treat persisted subject colors as authoritative on every screen; apply defaults only to new or missing subjects, never write inferred colors on login or reload, so user edits survive subsequent visits.
- Keep edital synchronization in transactional database functions/triggers on the existing external client; use stable topic IDs and one zero-minute manual-question session per topic to avoid duplicate metrics, with unique normalized matching only as a fallback.
