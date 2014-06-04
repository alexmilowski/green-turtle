<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
   xmlns:xs="http://www.w3.org/2001/XMLSchema"
   exclude-result-prefixes="xs"
   version="2.0">
   
<xsl:param name="version.major"/>
<xsl:param name="version.minor"/>
<xsl:param name="version.release"/>
   
<xsl:output method="xml" doctype-public="-//Apple//DTD PLIST 1.0//EN" doctype-system="http://www.apple.com/DTDs/PropertyList-1.0.dtd"/>
   
<xsl:template match="string[.='$version.major.minor'">
   <string><xsl:value-of select="$version.major"/>.<xsl:value-of select="$version.minor"/></string>
</xsl:template>
<xsl:template match="string[.='$version.release'">
   <string><xsl:value-of select="$version.release"/></string>
</xsl:template>
<xsl:template match="node()|@*">
   <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
   </xsl:copy>
</xsl:template>
   
</xsl:stylesheet>