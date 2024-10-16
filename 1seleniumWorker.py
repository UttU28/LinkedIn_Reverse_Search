from utils.workingSelenium import prepareChromeAndSelenium, runSelenium, scrapeDataFrom


chromeProcess, driver = prepareChromeAndSelenium()

firstName = "John"
lastName = "D'Agostino"
companyName = "Coinbase International"


# runSelenium(driver, f'https://www.linkedin.com/search/results/people/?company={companyName}&firstName={firstName}&lastName={lastName}&origin=FACETED_SEARCH', companyName)
runSelenium(driver, f'https://www.linkedin.com/in/johnjdagostino1/')
thisData = scrapeDataFrom(driver, companyName)

if thisData:
    print(thisData)