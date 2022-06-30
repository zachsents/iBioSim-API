/*

    Synchronous endpoints -- not ideal for longer operations,
    but can be used directly with browser clients.

*/

import os from "os"
import path from "path"

import convert from "./conversion.js"
import { getBaseFileName, processParameters, zip } from "./util.js"
import analyze, { ParameterMap as AnalysisParameterMap } from "./analysis.js"
import { log, logError, logSuccess } from "./logger.js"


export default function sync(app) {

    // POST convert
    app.post('/sync/convert', async (req, res) => {

        const { sbol } = req.files

        // validate SBOL file exists
        if (!sbol?.path) {
            res.status(500).json({ error: "Must attach an SBOL file with key 'sbol'." })
            return
        }

        // create working directory
        const workingDir = path.join(os.tmpdir(), `conversion-${getBaseFileName(sbol.path)}`)
        log(`Active directory: ${workingDir}`, 'yellow', 'Conversion')

        try {
            // convert
            const conversionOutput = await convert(sbol.path, {
                workingDir,
            })

            logSuccess("Conversion successful.", "Conversion")

            // pipe output stream to response
            conversionOutput.pipe(res)
        }
        catch (error) {
            logError("Error during conversion. See response for details.", 'Conversion')
            res.status(500).json({ error })
        }
        finally {
            // TO DO: clean up temp files
        }
    })


    // POST analyze
    app.post('/sync/analyze', async (req, res) => {

        const { input, environment } = req.files

        // validate SBML file exists
        if (!input) {
            res.status(500).json({ error: "Must attach an SBML file with key 'sbml'." })
            return
        }

        // grab unique name we'll use from now on
        const workingDir = path.join(os.tmpdir(), `analysis-${getBaseFileName(input.path)}`)
        log(`Active directory: ${workingDir}`, 'yellow', 'Analysis')

        try {
            // analyze
            const analysisOutput = await analyze(input.path, {
                workingDir,
                parameters: processParameters(req.body, AnalysisParameterMap),
                environment
            })

            logSuccess("Analysis successful.", "Analysis")

            analysisOutput.pipe(res)
        }
        catch (error) {
            logError("Error during analysis. See response for details.", 'Analysis')
            res.status(500).json({ error })
        }
        finally {
            // TO DO: clean up temp files
        }
    })
}