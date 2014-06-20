/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.milowski.sparql;

import com.hp.hpl.jena.query.Dataset;
import com.hp.hpl.jena.query.DatasetFactory;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.Map;
import java.util.TreeMap;
import java.util.logging.Level;
import org.apache.jena.riot.Lang;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.jena.riot.RDFFormat;
import org.apache.jena.riot.RDFWriterRegistry;
import org.apache.jena.riot.WriterDatasetRIOT;
import org.apache.jena.riot.WriterDatasetRIOTFactory;
import org.apache.jena.riot.writer.NQuadsWriter;
import org.restlet.data.MediaType;
import org.restlet.data.Status;
import org.restlet.representation.Representation;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.ServerResource;

/**
 *
 * @author alex
 */
public class NewContextResource extends ServerResource {
   
   static String escape(String v) {
      String parts [] = v.split("(?<=&<)|(?=&<)");
      StringBuilder sb = new StringBuilder();
      for (int i=0; i<parts.length; i++) {
         if (parts[i].equals("&")) {
            sb.append("&amp;");
         } else if (parts[i].equals("<")) {
            sb.append("&lt;");
         } else {
            sb.append(parts[i]);
         }
      }
      return sb.toString();
   }
   public Representation post(Representation entity) {
      Map<String,Dataset> datasets = (Map<String,Dataset>)getContext().getAttributes().get("datasets");
      if (datasets==null) {
         datasets = new TreeMap<String,Dataset>();
         getContext().getAttributes().put("datasets",datasets);
      }
      try {
         String turtle = entity.getText();
         Dataset data = DatasetFactory.createMem();
         if (turtle!=null) {
            getContext().getLogger().info(turtle);
            RDFDataMgr.read(data, new StringReader(turtle), null,Lang.TURTLE);
         }
         StringWriter out = new StringWriter();
         if (RDFWriterRegistry.getWriterDatasetFactory(RDFFormat.TURTLE)==null) {
            WriterDatasetRIOTFactory factory = new WriterDatasetRIOTFactory() {
               public WriterDatasetRIOT create(RDFFormat format) {
                  return new NQuadsWriter();
               }
            };
            RDFWriterRegistry.register(RDFFormat.TURTLE, factory);
         }
         RDFDataMgr.write(out, data, RDFFormat.TURTLE);
         getLogger().info("Parsed:\n"+out.toString());
         String id = System.currentTimeMillis()+"-"+((int)(Math.random()*10000));
         datasets.put(id,data);
         getResponse().setStatus(Status.SUCCESS_OK);
         return new StringRepresentation("<ok id=\""+id+"\"/>", MediaType.APPLICATION_XML);
      } catch (org.apache.jena.riot.RiotException ex) {
         getLogger().log(Level.SEVERE,"Cannot parse turtle: "+ex.toString());
         getResponse().setStatus(Status.CLIENT_ERROR_BAD_REQUEST);
         return new StringRepresentation("<error>"+escape(ex.toString())+"</error>", MediaType.APPLICATION_XML);
      } catch (Exception ex) {
         getLogger().log(Level.SEVERE,"Cannot parse incoming turtle.",ex);
         getResponse().setStatus(Status.CLIENT_ERROR_EXPECTATION_FAILED);
         return new StringRepresentation("<fatal/>", MediaType.APPLICATION_XML);
      }
   }
   
}
