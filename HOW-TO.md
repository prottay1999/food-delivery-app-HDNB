# Prototype kit: try your fix on a copy of the app

Use this before you write up your fix. You change a copy of one of the seven apps with a free AI tool and see the result on screen.

## The seven apps

- food-delivery-app: the customer app. Browse restaurants, order food and track the order.
- rider-app: the rider app. Go online, accept an order, pick it up and deliver it.
- restaurant-app: the restaurant tablet. Accept orders, mark them ready, and see the menu and payouts.
- ops-tool: the operations tool. Watch live orders, assign riders and check restaurant payouts.
- support-tool: the support tool. Answer customer tickets, link orders and send refunds.
- kam-tool: the key account manager tool. Manage restaurants, new sign-ups, requests and discounts.
- marketing-tool: the marketing tool. Manage pop-ups, push messages, promo codes and banners.

## What you get

- all-apps.zip: all seven apps and a start page. Unzip it and double-click index.html to see the menu of apps.
- One zip for each app (food-delivery-app.zip, rider-app.zip, restaurant-app.zip, ops-tool.zip, support-tool.zip, kam-tool.zip, marketing-tool.zip). Unzip it and double-click the index.html inside.
- app-screens.zip: five customer screens, each one a single HTML file. They are home, search, restaurant, cart and checkout.

Every app runs from its own index.html, and you do not need a server.

## Test logins

- Customer app: type 01712 345678 to see a customer with past orders. Any other number opens a new account. Any 6 digits work as the code.
- Rider app: no login. It opens as the rider Rubel. Tap Go online to get an order.
- Restaurant app: no login. Pick the restaurant in the grey bar at the top.
- Ops tool: click Log in. The email (ops@fooddelivery.example) and the password are already filled in.
- Support tool: click Log in. The email (agent07@fooddelivery.example) and the password are already filled in.
- KAM tool: no login. It opens as Ayesha, a KAM executive.
- Marketing tool: no login. It opens as Nabila, a CRM manager.

Each app has a Reset data button. It clears the changes you made and starts the app again.

## Steps in Google AI Studio

1. Open aistudio.google.com and sign in with your Gmail account.
2. Click Build.
3. Upload all-apps.zip, or the zip of the one app you need.
4. AI Studio may open only one app at first. This is normal.
5. To open another app, open that folder's index.html in the file list. You can also ask the tool: "Show the rider app".
6. Describe the change you want in one or two sentences.
7. Check the preview, then ask for fixes if you need them.

## Steps in Gemini Canvas

1. Open gemini.google.com and sign in with your Gmail account.
2. Open the tools menu and pick Canvas.
3. Upload one screen file (for example restaurant.html from app-screens.zip).
4. Describe the change you want in one or two sentences.
5. Check the preview on the right.
6. If something looks wrong, tell Gemini what is wrong and ask it to fix it.

Free AI tools work best with one file, so start with one screen. Pick the screen where your problem shows up.

## Three sample prompts

Try these first to see how the tool works, then write your own prompt for your fix.

1. Add a "Reorder your last meal" card at the top of the home screen.
2. Make the search bar bigger and add three suggestion chips under it.
3. Add a small banner on the cart screen that says how much more to add for free delivery.

## Tips

- Change one thing at a time.
- If the tool breaks the page, ask it to undo the last change.
- Take a screenshot of the result. You can use it in your write-up.
