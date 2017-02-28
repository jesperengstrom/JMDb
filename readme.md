I princip har jag fyra moduler som hanterar all funktionalitet: makeNew, store, search and print.

Som namnen antyder så är makeNew till för att skapa nya filmer, store är för att lagra och hämta data i filmdatabasen, 
search tar emot sökningar från sökformuläret och print sköter hur filmerna renderas på skärmen.

Detta täcker in allt som jag behöver göra, och att gruppera funktionaliteten i dessa fyra moduler var praktiskt av två anledningar: 

Dels för min egen skull, för att sortera och snabbt hitta i koden och få en mental bild av hur den var uppbyggd.
Dels för att kunna begränsa tillgången till funktioner och variabler och minska risken för konflikter och att värden
skrivs över. Att ha publika metoder som kommunicerar med de andra modulerna och bestämmer vad som släpps in och ut gjorde att hela koden
kändes mindre bräcklig.

Koden är består mest av module pattern och revealing module pattern. 
MakeNew och search innehåller konstruktorer, vilket verkar kallas för revealing prototype pattern.