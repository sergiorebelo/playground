package org.sergiorebelo.playground.rest.client;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@Path("")//("/api")
@RegisterRestClient(configKey = "external-gender-api")
public interface ExternalGenderApiService {

    @GET
    @Path("")//""/resource")
    @Produces(MediaType.APPLICATION_JSON)
    ResponseData getResource(@QueryParam("name") String name);
}
