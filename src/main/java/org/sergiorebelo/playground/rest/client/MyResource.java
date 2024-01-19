package org.sergiorebelo.playground.rest.client;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import org.eclipse.microprofile.rest.client.inject.RestClient;

// This class exists only to give us an endpoint to test our different external Service integrations.


@Path("/myApp")
public class MyResource {

    @Inject
    @RestClient
    ExternalGenderApiService externalGenderApiService;

    @Inject
    @RestClient
    ExternalCatFactsApiService externalCatFactsApiService;



    @GET
    @Path("/call-gender-api/{name}")
    public ExternalGenderApiResponseData callGenderExternalService(@PathParam("name") String name) {

        return externalGenderApiService.getResource(name);
    }

    @GET
    @Path("/call-cat-facts-api/")
    public ExternalCatFactsApiResponseData callCatFactsExternalService() {

        return externalCatFactsApiService.getResource();
    }
}

