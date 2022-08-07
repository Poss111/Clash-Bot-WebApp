# Clash-Bot-WebApp

## Summary
Ever wanted to be able to prepare for a League of Legends Clash Tournament but no one on your Discord Server likes to communicate?? Look no further! Clash Bot is here!

Clash Bot will notify you of upcoming League of Legends Clash Tournaments, setup role based Teams, provide a way for you to assign preferred champions and let you specify that you are Tentatively available for a Tournament.

## Project Setup
| Project                  | Summary                                                                                                                |
|--------------------------|------------------------------------------------------------------------------------------------------------------------|
| ClashBot-UI              | The front end webapp used for interaction with the Clash Bot.                                                          |
| ClashBot-OpenAPI         | The rest and async service contract specified for the Clash Bot.                                                       |
| ClashBot-Service-OpenAPI | The rest service that supports the Clash Bot scheduling functionality.                                                 |
| ClashBot-WS-Service      | The websocket service that supports realtime notification of the Clash Bot scheduling.                                 |
| ClashBot-E2E             | The E2E test suite to verify the functionality between ClashBot-UI, ClashBot-Service-OpenAPI, and ClashBot-WS-Service. |

```mermaid
C4Context
  title System Context diagram for Clash Bot
  Person(browserBased, "Chrome/Firefox/Safari", "Users leveraging a browser.")
  Person(discord, "Discord", "Users interacting through Discord.")

  Enterprise_Boundary(b0, "Clash Bot") {
    System_Boundary(sb0, "Clash Bot Webapp") {
        System(clashBotWebApp, "Clash Bot Webapp", "Browser based client.")
        System(clashBotService, "Clash Bot OpenAPI Service", "Rest Api service.")
        System(clashBotWSService, "Clash Bot Websocket Service", "Websocket service.")
    }
    System_Boundary(sb1, "Clash Bot Discord") {
        System(clashBotDiscordBot, "Discord Bot", "Discord Bot service")
        System(clashBotNotificationLambda, "Lambda function", "Monday Morning Discord")
    }
  }
  
  Rel(browserBased, clashBotWebApp, "Uses")
  Rel(clashBotWebApp, clashBotService, "Leverages")
  Rel(clashBotWebApp, clashBotWSService, "Leverages")
  Rel(clashBotDiscordBot, clashBotService, "Uses")
  Rel(discord, clashBotDiscordBot, "Uses")
  Rel(clashBotNotificationLambda, discord, "Uses")

  UpdateElementStyle(customerA, $fontColor="red", $bgColor="grey", $borderColor="red")
  UpdateRelStyle(browserBased, clashBotWebApp, $textColor="blue", $lineColor="blue", $offsetX="5")
  UpdateRelStyle(clashBotNotificationLambda, discord, $textColor="blue", $lineColor="blue", $offsetY="-35", $offsetX="-30")
  UpdateRelStyle(discord, clashBotDiscordBot, $textColor="blue", $lineColor="blue", $offsetY="-10", $offsetX="-20")
  UpdateRelStyle(clashBotWebApp, clashBotService, $textColor="green", $lineColor="green", $offsetY="-20", $offsetX="-20")
  UpdateRelStyle(clashBotWebApp, clashBotWSService, $textColor="green", $lineColor="green", $offsetX="10")
  UpdateRelStyle(clashBotDiscordBot, clashBotService, $textColor="green", $lineColor="green", $offsetY="10", $offsetX="-13")
  UpdateRelStyle(SystemC, customerA, $textColor="red", $lineColor="red", $offsetX="-50", $offsetY="20")

  UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="2")
```


## Disclaimer
Clash-Bot is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.