package org.sergiorebelo.playground;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.sergiorebelo.playground.rest.client.ExternalGenderApiService;

@ApplicationScoped
public class GenderInformationFacade {

    @Inject
    @RestClient
    ExternalGenderApiService externalGenderApiService;

    public Gender getGenderForName(String name) {

        return Gender.fromString(externalGenderApiService.getResource(name).getGender());


    }


    public enum Gender {
        MALE("Male"),
        FEMALE("Female"),
        NON_BINARY("Non-Binary"),
        OTHER("Other"); // Placeholder for other non-binary values

        private final String displayName;

        Gender(String displayName) {
            this.displayName = displayName;
        }

        // Optionally, add a method to parse from a string to a Gender
        public static Gender fromString(String text) {
            for (Gender g : Gender.values()) {
                if (g.displayName.equalsIgnoreCase(text)) {
                    return g;
                }
            }
            return OTHER; // Default to OTHER if no match is found
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}
