# Smart Business Consultancy Firm: Website Setup Guide

This guide takes you from the files in this folder to a live website on your own domain.

## 1. What is in this folder

| File | What it is |
|---|---|
| `index.html` | The whole website (Bengali + English, blog, FAQ, booking). |
| `robots.txt` | Tells Google it may read your site. Edit the domain name inside (step 4). |
| `sitemap.xml` | A list of your pages for Google. Edit the domain name inside (step 4). |
| `logo-landscape.jpg` | Wide version of your logo (already built into the website). Use it on Facebook, posters or documents. |
| `logo-original-square.png` | Your original square logo file. |
| `privacy.html` | The Privacy Policy as its own page (Bengali and English). The same text is also inside `index.html` (footer link). |
| `booking-backend.gs` | Google Apps Script code that stores bookings in a Google Sheet and blocks taken time slots (step 8). |
| `SETUP-GUIDE.md` | This guide. |

You do not need any coding tool. `index.html` can be opened by double-clicking it to preview.

## 2. Buy a domain name

1. Choose a short name people can spell, for example `smartbusinessbd.com`.
2. Buy it from a domain registrar of your choice. A `.com` is the easiest to buy online. A `.com.bd` is also possible through Bangladeshi registrars, but check the price and requirements yourself.
3. Use an email address you will always have access to when you register, and keep the login safe.

## 3. Put the website online (pick ONE option)

Menu names change from time to time, so look for the closest matching wording.

### Option A: Cloudflare Pages (free, recommended)

1. Create a free account at Cloudflare.
2. Open **Workers & Pages**, choose **Create**, then **Pages**, then **Upload assets** (direct upload).
3. Name the project, then drag the whole `website-package` folder in (or upload the files).
4. Press **Deploy**. You get a free temporary address ending in `.pages.dev`. Open it and check the site.
5. In the project, open **Custom domains**, add your domain and follow the on-screen steps (step 5 below).

### Option B: Netlify (free, very simple)

1. Create a free Netlify account.
2. Use its drag-and-drop deploy: drag the `website-package` folder onto the page.
3. Open **Domain management** and add your domain (step 5 below).

### Option C: Your own VPS (you already have or want one)

1. Point your domain to the VPS IP address with an **A record** in your domain's DNS settings.
2. Install a web server and upload the files:

```bash
sudo apt update && sudo apt install -y nginx
sudo mkdir -p /var/www/smartbusiness
# upload the files from this folder into /var/www/smartbusiness (scp, sftp or rsync)
```

3. Create `/etc/nginx/sites-available/smartbusiness`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/smartbusiness;
    index index.html;
    location / { try_files $uri $uri/ =404; }
}
```

4. Turn it on and add free HTTPS:

```bash
sudo ln -s /etc/nginx/sites-available/smartbusiness /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 4. Connect your domain

1. In your host (Option A or B), add your domain. It will show you either **nameservers** or **DNS records** to set.
2. Log in to your domain registrar, open the domain's DNS settings, and enter exactly what the host showed.
3. Wait from a few minutes up to a day. HTTPS (the padlock) is added automatically by Cloudflare and Netlify.
4. Open `https://yourdomain.com` on your phone and computer and check it works.

## 5. Fill in your domain name (important for Google)

1. In `robots.txt` and `sitemap.xml`, replace `YOURDOMAIN.com` with your real domain.
2. In `index.html`, add this line inside `<head>` (also replace the domain):

```html
<link rel="canonical" href="https://yourdomain.com/">
```

3. Upload the changed files again (re-deploy).

Tell me your domain and I will make these edits for you.

## 6. Get found on Google

1. **Google Search Console:** add your domain, verify it, then submit `https://yourdomain.com/sitemap.xml`.
2. **Google Business Profile:** list your office (Rahman Plaza, Victoria Road, Tangail) with your phone number and website link. For local searches this is usually the most important step. Google will verify your address, often by postcard or phone.
3. **Facebook page:** post regularly and link to the website.
4. **Printed material:** put the website address and a QR code on your poster and visiting card.
5. **Blog:** add a new article every week or two (see step 7). Real, useful articles are what help you rank.

## 7. Changing the website later

Open `index.html` in a text editor (Notepad++ or VS Code, not Word).

- **Change phone, email or address:** use find-and-replace for the old value. It appears in several places, including the footer and the WhatsApp links (`8801620148414`).
- **Add a blog article:** copy one whole `<article class="post"> ... </article>` block and edit the text.
- **English version of new text:** the English translations are stored in a list named `T` near the top of the `<script>` section. Every new Bengali sentence needs a matching English line there, or it will stay Bengali in English mode. If this is hard, send me the new text and I will do it.
- After editing, upload the file again to your host.

## 8. Booking: blocking taken time slots

Out of the box the booking form works in **WhatsApp mode**: the visitor picks a time and WhatsApp opens with the booking written. In this mode the site cannot know which times are already taken.

To block taken slots, connect the free Google Sheets booking system. Each booking becomes a row in your own Google Sheet, a time that is booked is greyed out for the next visitor, and you get an email for every booking.

### Set it up (about 15 minutes, free)

1. Open Google Sheets and create a new, empty spreadsheet. Name it "Smart Business Bookings".
2. Open **Extensions, then Apps Script**.
3. Delete the sample code, open `booking-backend.gs` from this folder, copy everything and paste it in. Check the settings at the top (`OWNER_EMAIL`, hours and closed days). They must match the website: 10:00 to 17:00 and closed on Friday.
4. In Apps Script open **Project settings** and set the time zone to **(GMT+06:00) Dhaka**. Save.
5. Press **Deploy, then New deployment**. Choose type **Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Press **Deploy** and approve the permissions Google asks for. (Google may show an "unverified app" warning because it is your own script. Choose Advanced, then continue.)
6. Copy the **Web app URL** (it ends in `/exec`).
7. Open `index.html` in a text editor and find this line near the top of the script:

```js
var BOOKING_API="";
```

   Paste your URL between the quotes, save, and upload the website again.
8. **Test it:** make a booking on the live site. A new row must appear in the sheet, you should get an email, and after you reload the page that time must show as "Booked".

### Everyday use

- **Free a time slot** (cancelled or rescheduled booking): change the **Status** cell of that row to `Cancelled`.
- **Mark progress:** you can change `New` to anything else, for example `Confirmed`. Only `Cancelled` frees the slot.
- **If you change the script code later:** use **Deploy, then Manage deployments, then Edit, then New version**, or the old code keeps running.
- **Do not share the sheet** with people who should not see customer names and phone numbers.

### Limits and honest notes

- I tested the booking logic with a simulated Google Sheet, but not on your real Google account. Always make a test booking yourself first.
- If the booking system is down or the URL is wrong, the form shows an error and offers a WhatsApp message instead, so visitors are not lost.
- Google limits the number of emails and requests a free account can send per day. This is plenty for a small consultancy.
- Customer data is stored in your Google account. Keep your Google account secured with 2-step verification.
- The booking web address is public, so anyone who finds it can see which times are taken (not names or phone numbers). The script rejects invalid, past, Friday and double bookings, ignores bots that fill the hidden field, and limits repeated bookings from one phone number.

## 9. Before you promote the site

- Read the Privacy Policy (the link is in the footer) and have it checked by a person who knows Bangladesh law. Update it if you add analytics, advertising, or a new way to collect data.
- Read both the Bengali and English text and correct anything that does not match your real services, fees or rules.
- Check the loan and government-support statements are accurate and that you can deliver what they say.
- Add real proof: a photo of your office or team, your registration or license number, and genuine client reviews (with permission).
- Test a booking from your own phone and confirm it arrives on your WhatsApp.
- Facebook and WhatsApp link previews look better with a 1200 x 630 image and an `og:image` tag. Ask me to add one when you have the image.

## 10. Better Google ranking later

All content is on one page. For stronger ranking, each blog article should have its own page address (for example `/blog/trade-license-renewal-tangail/`), and the English version should have its own address (`/en/`). I can build that multi-page version for you.
