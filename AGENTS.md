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
- Zoho CRM sync uses a DB outbox (triggers enqueue only) drained by /api/public/crm-worker; never call Zoho from checkout or triggers — keeps payments independent of CRM uptime.
- /admin management functions require the admin role server-side before loading the service client; moderators only get /admin/payments.
